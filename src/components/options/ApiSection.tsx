import { useEffect, useState } from 'react';
import { setApi, clearApi, getActiveApi, getActiveProvider, clearActiveProvider } from '../../vault/index.js';
import { testConnection } from '../../engine/api-gateway.js';
import type { ActiveApiConfig } from '../../vault/index.js';

type Provider = 'openai' | 'anthropic' | 'gemini';

const PROVIDERS: { id: Provider; label: string; defaultModel: string; placeholder: string }[] = [
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic', defaultModel: 'claude-3-5-haiku-latest', placeholder: 'sk-ant-...' },
  { id: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.0-flash', placeholder: 'AIza...' },
];

type ConnectionStatus = 'idle' | 'testing' | 'ok' | 'error';

export function ApiSection() {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<Provider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadCurrent() {
      const activeProvider = await getActiveProvider();
      if (activeProvider) {
        setEnabled(true);
        setProvider(activeProvider);
        // Key is encrypted; we don't display it back but show a placeholder
      }
      setLoaded(true);
    }
    void loadCurrent();
  }, []);

  const selected = PROVIDERS.find(p => p.id === provider)!;

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await setApi(provider, apiKey.trim(), customModel.trim() || undefined);
      setStatus('idle');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!apiKey.trim()) return;
    setStatus('testing');
    setErrorMsg('');
    const cfg: ActiveApiConfig = {
      provider,
      key: apiKey.trim(),
      model: customModel.trim() || undefined,
    };
    const result = await testConnection(cfg);
    if (result.ok) {
      setStatus('ok');
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Error desconocido');
    }
  }

  async function handleClear() {
    await clearApi(provider);
    setApiKey('');
    setCustomModel('');
    setEnabled(false);
    setStatus('idle');
  }

  if (!loaded) return <p className="text-sm text-zinc-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-base font-semibold text-zinc-100">API externa</h2>
        <p className="text-sm text-zinc-400">
          Opcional. Usa un proveedor de IA externo para reescrituras de mayor calidad. Tu texto se
          enviará al proveedor que configures.
        </p>
      </div>

      {/* Enable toggle */}
      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">Usar API externa</p>
          <p className="text-xs text-zinc-500">Requiere API key del proveedor elegido</p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={async e => {
            setEnabled(e.target.checked);
            if (!e.target.checked) {
              await clearActiveProvider();
            }
          }}
          className="h-4 w-4 accent-emerald-500"
        />
      </label>

      <fieldset disabled={!enabled} className="flex flex-col gap-4">
        {/* Provider */}
        <div className="flex flex-col gap-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Proveedor
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setStatus('idle');
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  provider === p.id
                    ? 'border-sky-600/60 bg-sky-900/20 text-sky-300'
                    : 'border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* API key */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            API Key
          </span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={enabled ? selected.placeholder : 'Activa la API para configurar'}
            value={apiKey}
            onChange={e => {
              setApiKey(e.target.value);
              setStatus('idle');
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-sky-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>

        {/* Optional model override */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Modelo{' '}
            <span className="font-normal normal-case text-zinc-500">
              (opcional, por defecto: {selected.defaultModel})
            </span>
          </span>
          <input
            type="text"
            placeholder={selected.defaultModel}
            value={customModel}
            onChange={e => setCustomModel(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-sky-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!apiKey.trim() || status === 'testing'}
            onClick={() => void handleTest()}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-semibold text-zinc-300 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === 'testing' ? 'Probando…' : 'Probar conexión'}
          </button>
          <button
            type="button"
            disabled={!apiKey.trim() || saving}
            onClick={() => void handleSave()}
            className="flex-1 rounded-lg border border-sky-700/60 bg-sky-900/20 px-3 py-2 text-xs font-semibold text-sky-300 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>

        {/* Connection status */}
        {status === 'ok' && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span>✓</span> Conectado correctamente
          </p>
        )}
        {status === 'error' && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <span>✕</span> {errorMsg || 'Error al conectar'}
          </p>
        )}

        {/* Clear */}
        <button
          type="button"
          onClick={() => void handleClear()}
          className="self-start rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 transition-opacity hover:opacity-80"
        >
          Eliminar configuración
        </button>
      </fieldset>
    </div>
  );
}
