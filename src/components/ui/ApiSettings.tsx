import { useState } from 'react';

type Provider = 'openai' | 'anthropic' | 'gemini';

const PROVIDERS: { id: Provider; label: string; defaultModel: string }[] = [
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', label: 'Anthropic', defaultModel: 'claude-haiku-3-5' },
  { id: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.0-flash' },
];

export function ApiSettings() {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<Provider>('openai');
  const [apiKey, setApiKey] = useState('');

  const selected = PROVIDERS.find(p => p.id === provider)!;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-400">
        Opcional: usa una API externa para mayor calidad. Tu texto se enviará al proveedor que elijas.
      </p>

      <label className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-900/40 px-3 py-2">
        <span className="text-sm text-zinc-200">Usar API externa</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5" disabled={!enabled}>
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Proveedor
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`rounded border px-2 py-1.5 text-xs transition-colors ${
                provider === p.id
                  ? 'border-sky-500/60 bg-sky-500/10 text-sky-300'
                  : 'border-zinc-700 bg-zinc-900/40 text-zinc-300 hover:border-zinc-500'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          API key
        </span>
        <input
          type="password"
          autoComplete="off"
          placeholder={enabled ? `Tu key de ${selected.label}` : 'Activa la API para configurar'}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          disabled={!enabled}
          className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-sky-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>

      <button
        type="button"
        disabled
        title="Disponible en Fase 2"
        className="rounded border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs text-zinc-500 disabled:cursor-not-allowed"
      >
        Probar conexión
      </button>

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Modelo por defecto: <span className="text-zinc-400">{selected.defaultModel}</span>
      </p>
    </div>
  );
}
