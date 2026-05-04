import { useEffect, useState } from 'react';
import { Toggle } from '../../components/ui/Toggle.js';
import { LevelSelector } from '../../components/ui/LevelSelector.js';
import { EngineStatus } from '../../components/ui/EngineStatus.js';
import { getEnabled, setEnabled, getLevel, setLevel } from '../../vault/index.js';
import { openOptionsToSection } from '../../utils/navigate-options.js';
import type { PrivacyLevel } from '../../types/index.js';

export function App() {
  const [enabled, setEnabledState] = useState(true);
  const [level, setLevelState] = useState<PrivacyLevel>('medium');
  const [loaded, setLoaded] = useState(false);

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

  return (
    <main className="flex h-full min-h-0 flex-col gap-0">
      <header className="flex shrink-0 flex-col gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-semibold text-zinc-100">GhostType</span>
            <EngineStatus />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => void openOptionsToSection('general')}
              className="rounded-md border border-zinc-600 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              title="Ajustes generales, enlace a esta página, etc."
            >
              Más ajustes
            </button>
            <Toggle checked={enabled} onChange={onToggle} label="Activar" />
          </div>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
        {!loaded ? (
          <p className="text-xs text-zinc-500">Cargando…</p>
        ) : (
          <LevelSelector value={level} onChange={onLevelChange} />
        )}
      </section>
    </main>
  );
}
