import { pipeline, env } from '@huggingface/transformers';
import { getActiveApi, getActiveModelId } from '../vault/index.js';
import { isDownloaded } from './model-manager.js';
import { findModelById } from './models.js';
import * as apiGateway from './api-gateway.js';
import type { Signal, PrivacyLevel, RewriteResult } from '../types/index.js';

const TIMEOUT_MS = 8_000;

// Configure WASM paths for MV3 at module load time
try {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('transformers/');
} catch {
  // Non-extension environment (tests); skip
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);
}

function buildLocalPrompt(text: string, level: PrivacyLevel): string {
  const levelHint =
    level === 'soft'
      ? 'Remove only direct identifiers like names, emails, and phone numbers.'
      : level === 'medium'
        ? 'Remove identifiers, locations, professions, and specific tools.'
        : 'Maximize anonymity: remove all potentially identifying context.';

  return `Rewrite this text to protect privacy. ${levelHint} Output only the rewritten text.\n\nText: ${text}\n\nRewritten:`;
}

async function localRewrite(
  modelId: string,
  text: string,
  level: PrivacyLevel,
): Promise<RewriteResult> {
  const model = findModelById(modelId);
  if (!model) return { suggestion: null, reason: 'local-error' };

  try {
    const pipe = await pipeline('text2text-generation', model.repo, {
      device: 'webgpu',
      dtype: model.dtype as 'q8',
    });

    const prompt = buildLocalPrompt(text, level);
    const maxTokens = Math.min(text.length * 2, 512);

    const result = await pipe(prompt, { max_new_tokens: maxTokens, num_beams: 1 });
    const output = Array.isArray(result) ? result[0] : result;
    const suggestion =
      typeof output === 'object' && output !== null && 'generated_text' in output
        ? String((output as { generated_text: string }).generated_text).trim()
        : null;

    return suggestion ? { suggestion, source: 'local' } : { suggestion: null, reason: 'local-error' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GhostType rewriter] local inference error:', message);
    return { suggestion: null, reason: 'local-error' };
  }
}

export async function rewrite(
  text: string,
  _signals: Signal[],
  level: PrivacyLevel,
): Promise<RewriteResult> {
  try {
    const apiCfg = await getActiveApi();
    if (apiCfg) {
      return await withTimeout(apiGateway.rewrite(apiCfg, text, level), TIMEOUT_MS);
    }

    const modelId = await getActiveModelId();
    if (modelId && (await isDownloaded(modelId))) {
      return await withTimeout(localRewrite(modelId, text, level), TIMEOUT_MS);
    }

    return { suggestion: null, reason: 'no-engine-configured' };
  } catch (err) {
    if (err instanceof Error && err.message === 'timeout') {
      return { suggestion: null, reason: 'timeout' };
    }
    return { suggestion: null, reason: 'local-error' };
  }
}
