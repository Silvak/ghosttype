import { getActiveApi, getActiveModelId } from '../vault/index.js';
import { isDownloaded } from './model-manager.bg.js';
import { findModelById } from './models.js';
import { sendToOffscreen } from './offscreen-bridge.js';
import * as apiGateway from './api-gateway.js';
import type { Signal, PrivacyLevel, RewriteResult } from '../types/index.js';

const TIMEOUT_MS = 8_000;

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
      return { suggestion: response.suggestion, source: 'local' };
    }
    return { suggestion: null, reason: 'local-error', errorDetail: response.error };
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
