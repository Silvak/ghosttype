import { useEffect, useState } from 'react';
import { getEngineDisplayState } from '../../engine/engine-state.js';
import type { EngineDisplayState } from '../../engine/engine-state.js';

function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
  };
  return labels[provider] ?? provider;
}

export function EngineStatus() {
  const [state, setState] = useState<EngineDisplayState>({ kind: 'none' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const next = await getEngineDisplayState();
      if (!cancelled) setState(next);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const styles = {
    none: 'bg-zinc-700/40 text-zinc-400 border-zinc-700',
    api: 'bg-sky-500/10 text-sky-400 border-sky-500/40',
    local: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  } as const;

  const label =
    state.kind === 'none'
      ? 'Sin engine configurado'
      : state.kind === 'api'
        ? `${providerLabel(state.provider)} · ${state.model}`
        : `Local: ${state.label}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[state.kind]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          state.kind === 'none'
            ? 'bg-zinc-500'
            : state.kind === 'api'
              ? 'bg-sky-400'
              : 'bg-emerald-400'
        }`}
      />
      {label}
    </span>
  );
}
