import { useEffect, useState } from 'react';
import { Toggle } from '../ui/Toggle.js';
import { LevelSelector } from '../ui/LevelSelector.js';
import { EngineStatusCard } from './EngineStatusCard.js';
import { getEnabled, setEnabled, getLevel, setLevel } from '../../vault/index.js';
import type { PrivacyLevel } from '../../types/index.js';

export function GeneralSection() {
  const [enabled, setEnabledState] = useState(true);
  const [level, setLevelState] = useState<PrivacyLevel>('medium');
  const [loaded, setLoaded] = useState(false);
  const [optionsUrl] = useState(() => chrome.runtime.getURL('options.html'));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void Promise.all([getEnabled(), getLevel()]).then(([e, l]) => {
      setEnabledState(e);
      setLevelState(l);
      setLoaded(true);
    });
  }, []);

  async function onToggle(next: boolean) {
    setEnabledState(next);
    await setEnabled(next);
  }

  async function onLevelChange(next: PrivacyLevel) {
    setLevelState(next);
    await setLevel(next);
  }

  if (!loaded) return <p className="text-sm text-zinc-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-base font-semibold text-zinc-100">General</h2>
        <p className="text-sm text-zinc-400">Controles principales de GhostType.</p>
      </div>

      {/* Engine status */}
      <EngineStatusCard />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            window.location.hash = 'models';
          }}
          className="rounded-lg border border-sky-700/50 bg-sky-950/40 px-4 py-2 text-xs font-semibold text-sky-200 transition-colors hover:border-sky-500 hover:bg-sky-900/50"
        >
          Ir a modelos (pantalla completa de descargas)
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.hash = 'api';
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600"
        >
          Ir a API
        </button>
      </div>

      {/* On / Off */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-200">Activar GhostType</p>
          <p className="text-xs text-zinc-500">Analiza texto mientras escribes</p>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label="Activar GhostType" />
      </div>

      {/* Level */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <LevelSelector value={level} onChange={onLevelChange} />
      </div>

      {/* Direct link — bookmarkable */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Enlace a esta página
        </p>
        <p className="mb-2 text-xs text-zinc-500">
          Puedes guardar o compartir esta URL; es la configuración completa de GhostType.
        </p>
        <code className="mb-3 block break-all rounded border border-zinc-800 bg-zinc-900/80 px-2 py-2 text-[11px] text-zinc-300">
          {optionsUrl}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(optionsUrl).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="rounded-md border border-zinc-600 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-zinc-50"
        >
          {copied ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  );
}
