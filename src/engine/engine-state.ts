import { getActiveApi, getActiveModelId, getModelCache } from '../vault/index.js';
import { MODEL_CATALOG } from './models.js';

export type EngineKind = 'none' | 'api' | 'local';

export type EngineDisplayState =
  | { kind: 'none' }
  | { kind: 'api'; provider: string; model: string }
  | { kind: 'local'; label: string };

function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
  };
  return labels[provider] ?? provider;
}

function defaultModelFor(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-latest',
    gemini: 'gemini-2.0-flash',
  };
  return defaults[provider] ?? provider;
}

/** Shared logic for popup/options engine badge and CTAs */
export async function getEngineDisplayState(): Promise<EngineDisplayState> {
  const api = await getActiveApi();
  if (api) {
    const modelLabel = api.model ?? defaultModelFor(api.provider);
    return { kind: 'api', provider: api.provider, model: modelLabel };
  }

  const modelId = await getActiveModelId();
  if (modelId) {
    const cached = await getModelCache(modelId);
    if (cached) {
      const entry = MODEL_CATALOG.find(m => m.id === modelId);
      return { kind: 'local', label: entry?.label ?? modelId };
    }
  }

  return { kind: 'none' };
}
