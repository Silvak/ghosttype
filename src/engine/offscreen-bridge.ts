/**
 * Offscreen Bridge — GhostType
 *
 * Manages the lifecycle of the single MV3 offscreen document and provides
 * typed helpers to send messages to it.
 *
 * Can be called from any extension context (background SW, options page, popup)
 * that holds the 'offscreen' permission.
 */

const OFFSCREEN_URL = 'offscreen.html';
const OFFSCREEN_REASON: chrome.offscreen.Reason =
  'WORKERS' as chrome.offscreen.Reason;
const OFFSCREEN_JUSTIFICATION = 'Run on-device AI model for privacy rewriting';

export interface OffscreenResponse<T = unknown> {
  ok: boolean;
  error?: string;
  suggestion?: T;
}

async function ensureOffscreen(): Promise<void> {
  if (!chrome.offscreen) {
    throw new Error('chrome.offscreen API not available (requires Chrome 116+ and offscreen permission)');
  }
  const hasDoc = await chrome.offscreen.hasDocument();
  if (!hasDoc) {
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL(OFFSCREEN_URL),
      reasons: [OFFSCREEN_REASON],
      justification: OFFSCREEN_JUSTIFICATION,
    });
  }
}

/**
 * Send a one-shot message to the offscreen document and await its response.
 * The offscreen document is created if it does not already exist.
 */
export async function sendToOffscreen<T = unknown>(
  message: object,
): Promise<OffscreenResponse<T>> {
  await ensureOffscreen();
  return chrome.runtime.sendMessage({
    target: 'offscreen',
    ...message,
  }) as Promise<OffscreenResponse<T>>;
}

/**
 * Start a model download in the offscreen document.
 *
 * The offscreen document fires `offscreen:progress` messages during the download;
 * this function installs a temporary listener and translates them into
 * `onProgress(loaded, total)` calls.
 *
 * Resolves when the download is complete, rejects on error.
 */
export async function downloadViaOffscreen(
  modelId: string,
  repo: string,
  dtype: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  await ensureOffscreen();

  return new Promise<void>((resolve, reject) => {
    const progressListener = (msg: unknown) => {
      if (
        typeof msg === 'object' &&
        msg !== null &&
        (msg as Record<string, unknown>).type === 'offscreen:progress' &&
        (msg as Record<string, unknown>).modelId === modelId
      ) {
        const { loaded, total } = msg as { loaded: number; total: number };
        onProgress(loaded, total);
      }
    };

    chrome.runtime.onMessage.addListener(progressListener);

    chrome.runtime
      .sendMessage({
        target: 'offscreen',
        type: 'offscreen:download',
        modelId,
        repo,
        dtype,
      })
      .then((response: unknown) => {
        chrome.runtime.onMessage.removeListener(progressListener);
        const r = response as OffscreenResponse;
        if (r?.ok) {
          resolve();
        } else {
          reject(new Error(r?.error ?? 'Download failed'));
        }
      })
      .catch((err: unknown) => {
        chrome.runtime.onMessage.removeListener(progressListener);
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });
}
