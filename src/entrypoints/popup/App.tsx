import { useEffect, useState } from 'react';
import { Toggle } from '../../components/ui/Toggle.js';
import { LevelSelector } from '../../components/ui/LevelSelector.js';
import { EngineStatus } from '../../components/ui/EngineStatus.js';
import { ModelManager } from '../../components/ui/ModelManager.js';
import { ApiSettings } from '../../components/ui/ApiSettings.js';
import { getEnabled, setEnabled, getLevel, setLevel } from '../../vault/index.js';
import type { PrivacyLevel } from '../../types/index.js';

type Tab = 'general' | 'models' | 'api';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'models', label: 'Modelos' },
  { id: 'api', label: 'API' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('general');
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
    <main className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold text-zinc-100">GhostType</span>
          <EngineStatus status="none" />
        </div>
        <Toggle checked={enabled} onChange={onToggle} label="Activar GhostType" />
      </header>

      <nav className="flex border-b border-zinc-800 bg-zinc-900/40">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-emerald-500 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="flex-1 overflow-y-auto px-4 py-4">
        {!loaded ? (
          <p className="text-xs text-zinc-500">Cargando…</p>
        ) : tab === 'general' ? (
          <LevelSelector value={level} onChange={onLevelChange} />
        ) : tab === 'models' ? (
          <ModelManager />
        ) : (
          <ApiSettings />
        )}
      </section>
    </main>
  );
}
