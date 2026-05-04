import { getActiveApi, getActiveModelId } from '../vault/index.js';
import { isDownloaded } from './model-manager.bg.js';
import { findModelById } from './models.js';
import { sendToOffscreen } from './offscreen-bridge.js';
import * as apiGateway from './api-gateway.js';
import { redactKnownSignals } from './signal-redaction.js';
import type { Signal, PrivacyLevel, RewriteResult } from '../types/index.js';

/** API calls (abort-controlled inside api-gateway). */
const API_TIMEOUT_MS = 8_000;
/** WASM / local T5 cold start + generation can exceed several seconds. */
const LOCAL_REWRITE_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);
}

function buildLocalPrompt(text: string, level: PrivacyLevel): string {
  const rules = `You are a privacy assistant inside a browser extension.
Rewrite the user's text to remove or generalize PII while preserving meaning and tone.

Rules:
- Replace personal names → generic alternatives ("someone", "a person", "they")
- Generalize locations → ("a city in my region", "nearby", "my country")
- Remove or mask emails and phones completely
- Remove specific dates → rough timeframes ("recently", "a few years ago")
- Replace specific tools/tech → categories ("a JS framework", "a cloud provider")
- Do NOT add opinions or new information
- Output ONLY the rewritten text, no preface, no quotes
- Write the output in the SAME language as the user's text below`;

  const levelLine =
    level === 'soft'
      ? 'Privacy level: soft — only direct identifiers (names, emails, phones).'
      : level === 'medium'
        ? 'Privacy level: medium — also location, profession, specific tools.'
        : 'Privacy level: strong — maximize anonymity.';

  return `${rules}\n${levelLine}\n\nUser text:\n${text}\n\nRewritten:`;
}

async function localRewrite(
  modelId: string,
  text: string,
  signals: Signal[],
  level: PrivacyLevel,
): Promise<RewriteResult> {
  const model = findModelById(modelId);
  if (!model) return { suggestion: null, reason: 'local-error' };

  const fallback = (): RewriteResult | null =>
    signals.length > 0
      ? { suggestion: redactKnownSignals(text, signals, level), source: 'local' }
      : null;

  try {
    const prompt = buildLocalPrompt(text, level);
    const maxTokens = Math.min(text.length * 2, 512);

    const response = await sendToOffscreen<string>({
      type: 'offscreen:rewrite',
      modelId,
      repo: model.repo,
      dtype: model.dtype,
      prompt,
      maxTokens,
    });

    if (response.ok && response.suggestion) {
      return {
        suggestion: redactKnownSignals(response.suggestion, signals, level),
        source: 'local',
      };
    }

    const fb = fallback();
    if (fb) return { ...fb, reason: 'local-error', errorDetail: response.error };
    return { suggestion: null, reason: 'local-error', errorDetail: response.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GhostType rewriter] local inference error:', message);
    const fb = fallback();
    if (fb) return { ...fb, reason: 'local-error' };
    return { suggestion: null, reason: 'local-error' };
  }
}

export async function rewrite(
  text: string,
  signals: Signal[],
  level: PrivacyLevel,
): Promise<RewriteResult> {
  const localFailureWithRedaction = (
    reason: 'timeout' | 'local-error',
    errorDetail?: string,
  ): RewriteResult => {
    if (signals.length === 0) {
      return { suggestion: null, reason };
    }
    return {
      suggestion: redactKnownSignals(text, signals, level),
      reason,
      source: 'local',
      errorDetail:
        reason === 'timeout'
          ? 'La inferencia tardó demasiado; se aplicó redacción automática de datos detectados.'
          : errorDetail,
    };
  };

  const apiCfg = await getActiveApi();
  if (apiCfg) {
    try {
      return await withTimeout(apiGateway.rewrite(apiCfg, text, level), API_TIMEOUT_MS);
    } catch (err) {
      if (err instanceof Error && err.message === 'timeout') {
        return { suggestion: null, reason: 'timeout' };
      }
      const errorDetail = err instanceof Error ? err.message : String(err);
      return { suggestion: null, reason: 'api-error', errorDetail };
    }
  }

  try {
    const modelId = await getActiveModelId();
    if (modelId && (await isDownloaded(modelId))) {
      return await withTimeout(
        localRewrite(modelId, text, signals, level),
        LOCAL_REWRITE_TIMEOUT_MS,
      );
    }
    return { suggestion: null, reason: 'no-engine-configured' };
  } catch (err) {
    if (err instanceof Error && err.message === 'timeout') {
      return localFailureWithRedaction('timeout');
    }
    const detail = err instanceof Error ? err.message : String(err);
    return localFailureWithRedaction('local-error', detail);
  }
}
