/**
 * Offscreen Document — GhostType
 *
 * Runs @huggingface/transformers (ONNX via WebGPU/WASM) in an isolated DOM
 * context, away from the background service worker which lacks the required
 * browser APIs (WebGPU, SharedArrayBuffer, Cache API, etc.).
 *
 * Message protocol (all messages must have target: 'offscreen'):
 *   offscreen:download  — download a model; sends progress updates while running
 *   offscreen:rewrite   — run inference with a loaded pipeline
 *   offscreen:remove    — evict a model from cache and memory
 */

import { pipeline, env } from '@huggingface/transformers';

// ONNX Runtime Web (ort-wasm-*) en public/transformers/ (copia en prebuild) + WAR en manifest.
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('transformers/');
// Sin crossOriginIsolation no hay SharedArrayBuffer para pthreads; un hilo evita fallos al compilar WASM.
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}
env.allowRemoteModels = true;
env.useBrowserCache = true;

type TextPipeline = Awaited<ReturnType<typeof pipeline>>;

// Keeps loaded pipelines in memory to avoid reloading on every inference call.
const pipelineCache = new Map<string, TextPipeline>();

interface ProgressInfo {
  status: string;
  loaded?: number;
  total?: number;
  file?: string;
}

interface DownloadMessage {
  target: 'offscreen';
  type: 'offscreen:download';
  modelId: string;
  repo: string;
  dtype: string;
}

interface RewriteMessage {
  target: 'offscreen';
  type: 'offscreen:rewrite';
  modelId: string;
  repo: string;
  dtype: string;
  prompt: string;
  maxTokens: number;
}

interface RemoveMessage {
  target: 'offscreen';
  type: 'offscreen:remove';
  modelId: string;
  repo: string;
}

type OffscreenMessage = DownloadMessage | RewriteMessage | RemoveMessage;

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (r: unknown) => void) => {
    if (!isOffscreenMessage(message)) return false;

    if (message.type === 'offscreen:download') {
      void handleDownload(message, sendResponse);
      return true;
    }

    if (message.type === 'offscreen:rewrite') {
      void handleRewrite(message, sendResponse);
      return true;
    }

    if (message.type === 'offscreen:remove') {
      void handleRemove(message, sendResponse);
      return true;
    }

    return false;
  },
);

async function handleDownload(msg: DownloadMessage, sendResponse: (r: unknown) => void) {
  const { modelId, repo, dtype } = msg;

  try {
    const pipe = await pipeline('text2text-generation', repo, {
      dtype: dtype as 'q8',
      progress_callback: (info: ProgressInfo) => {
        if (info.status === 'progress' && typeof info.loaded === 'number' && typeof info.total === 'number') {
          // Fire-and-forget: progress is forwarded by the service worker to the options UI.
          chrome.runtime.sendMessage({
            type: 'offscreen:progress',
            modelId,
            loaded: info.loaded,
            total: info.total,
          }).catch(() => {
            // Ignore — listener may not be registered during very first progress tick.
          });
        }
      },
    });

    pipelineCache.set(modelId, pipe);
    sendResponse({ ok: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[GhostType offscreen] download error:', error);
    sendResponse({ ok: false, error });
  }
}

async function handleRewrite(msg: RewriteMessage, sendResponse: (r: unknown) => void) {
  const { modelId, repo, dtype, prompt, maxTokens } = msg;

  try {
    let pipe = pipelineCache.get(modelId);

    if (!pipe) {
      pipe = await pipeline('text2text-generation', repo, { dtype: dtype as 'q8' });
      pipelineCache.set(modelId, pipe);
    }

    const result = await pipe(prompt, { max_new_tokens: maxTokens, num_beams: 1 });
    const output = Array.isArray(result) ? result[0] : result;
    const raw =
      typeof output === 'object' && output !== null && 'generated_text' in output
        ? String((output as { generated_text: string }).generated_text).trim()
        : null;
    const suggestion = raw !== null ? stripEchoedPrompt(raw) : null;

    sendResponse({ ok: true, suggestion });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[GhostType offscreen] rewrite error:', error);
    sendResponse({ ok: false, error });
  }
}

async function handleRemove(msg: RemoveMessage, sendResponse: (r: unknown) => void) {
  const { modelId, repo } = msg;

  try {
    pipelineCache.delete(modelId);

    if (typeof caches !== 'undefined') {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const req of keys) {
          if (req.url.includes(repo)) {
            await cache.delete(req);
          }
        }
      }
    }

    sendResponse({ ok: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[GhostType offscreen] remove error:', error);
    sendResponse({ ok: false, error });
  }
}

/** T5 puede devolver prefijo del prompt + continuación; nos quedamos con la cola tras el marcador. */
function stripEchoedPrompt(generated: string): string {
  const markers = ['\n\nRewritten:', '\nRewritten:', 'Rewritten:'];
  for (const m of markers) {
    const idx = generated.lastIndexOf(m);
    if (idx !== -1) {
      const tail = generated.slice(idx + m.length).trim();
      if (tail.length > 0) return tail;
    }
  }
  return generated.trim();
}

function isOffscreenMessage(msg: unknown): msg is OffscreenMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as Record<string, unknown>).target === 'offscreen' &&
    typeof (msg as Record<string, unknown>).type === 'string'
  );
}
