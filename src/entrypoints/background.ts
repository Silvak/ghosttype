import { scan } from '../scanner/index.js';
import { getEnabled, getLevel } from '../vault/index.js';
import { rewrite } from '../engine/rewriter.js';
import type { PrivacyLevel, ScanResult, RuntimeMessage, RuntimeResponse } from '../types/index.js';

// Minimum signal count that triggers automatic rewriting per level
const AUTO_REWRITE_THRESHOLD: Record<PrivacyLevel, number> = {
  soft: Infinity, // never auto-rewrite on soft; on-demand only
  medium: 2,
  strong: 1,
};

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse: (r: RuntimeResponse) => void) => {
      if (!isValidMessage(message)) return false;

      void dispatch(message)
        .then(response => sendResponse(response))
        .catch(err => {
          const error = err instanceof Error ? err.message : 'Unknown error';
          console.error('[GhostType background] error:', error);
          sendResponse({ ok: false, error });
        });

      return true; // keep the message channel open for async sendResponse
    },
  );
});

async function dispatch(message: RuntimeMessage): Promise<RuntimeResponse> {
  const enabled = await getEnabled();
  if (!enabled) return { ok: false, error: 'disabled' };

  const level = await getLevel();

  if (message.type === 'scan') {
    return handleScan(message.text, level);
  }

  if (message.type === 'rewrite') {
    return handleRewrite(message.text, level);
  }

  return { ok: false, error: `Unknown message type` };
}

async function handleScan(text: string, level: PrivacyLevel): Promise<RuntimeResponse> {
  const result: ScanResult = scan(text, level);

  const threshold = AUTO_REWRITE_THRESHOLD[level];
  if (result.signals.length >= threshold) {
    const rewriteResult = await rewrite(text, result.signals, level);
    return {
      ok: true,
      result,
      suggestion: rewriteResult.suggestion,
      reason: rewriteResult.reason,
    };
  }

  return { ok: true, result };
}

async function handleRewrite(text: string, level: PrivacyLevel): Promise<RuntimeResponse> {
  // On-demand rewrite: scan first to get signals, then rewrite
  const result: ScanResult = scan(text, level);
  const rewriteResult = await rewrite(text, result.signals, level);
  return {
    ok: true,
    result,
    suggestion: rewriteResult.suggestion,
    reason: rewriteResult.reason,
  };
}

function isValidMessage(msg: unknown): msg is RuntimeMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as RuntimeMessage;
  if (m.type === 'scan' || m.type === 'rewrite') return typeof m.text === 'string';
  return false;
}
