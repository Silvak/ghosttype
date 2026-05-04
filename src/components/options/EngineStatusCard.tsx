import { useEffect, useState } from 'react';
import { getActiveApi, getActiveModelId } from '../../vault/index.js';
import { MODEL_CATALOG } from '../../engine/models.js';
import { getModelCache } from '../../vault/index.js';

interface EngineStatusCardProps {
  compact?: boolean;
}

type EngineState =
  | { kind: 'none' }
  | { kind: 'api'; provider: string; model: string }
  | { kind: 'local'; label: string };

export function EngineStatusCard({ compact = false }: EngineStatusCardProps) {
  const [state, setState] = useState<EngineState>({ kind: 'none' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const api = await getActiveApi();
      if (api && !cancelled) {
        const modelLabel = api.model ?? defaultModelFor(api.provider);
        setState({ kind: 'api', provider: api.provider, model: modelLabel });
        return;
      }

      const modelId = await getActiveModelId();
      if (modelId) {
        const cached = await getModelCache(modelId);
        if (cached && !cancelled) {
          const entry = MODEL_CATALOG.find(m => m.id === modelId);
          setState({ kind: 'local', label: entry?.label ?? modelId });
          return;
        }
      }

      if (!cancelled) setState({ kind: 'none' });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          state.kind === 'none'
            ? 'bg-zinc-800 text-zinc-500'
            : state.kind === 'api'
              ? 'bg-sky-900/40 text-sky-300'
              : 'bg-emerald-900/40 text-emerald-300'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            state.kind === 'none' ? 'bg-zinc-600' : state.kind === 'api' ? 'bg-sky-400' : 'bg-emerald-400'
          }`}
        />
        {state.kind === 'none'
          ? 'Sin engine'
          : state.kind === 'api'
            ? `API: ${providerLabel(state.provider)} · ${state.model}`
            : `Local: ${state.label}`}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 ${
        state.kind === 'none'
          ? 'border-zinc-800 bg-zinc-900/40'
          : state.kind === 'api'
            ? 'border-sky-800/40 bg-sky-900/20'
            : 'border-emerald-800/40 bg-emerald-900/20'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          state.kind === 'none' ? 'bg-zinc-600' : state.kind === 'api' ? 'bg-sky-400' : 'bg-emerald-400'
        }`}
      />
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Engine activo
        </span>
        <span className="text-sm text-zinc-100">
          {state.kind === 'none'
            ? 'Sin engine configurado'
            : state.kind === 'api'
              ? `API: ${providerLabel(state.provider)} · ${state.model}`
              : `Local: ${state.label}`}
        </span>
      </div>
    </div>
  );
}

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
    anthropic: 'claude-haiku-3-5',
    gemini: 'gemini-2.0-flash',
  };
  return defaults[provider] ?? provider;
}
