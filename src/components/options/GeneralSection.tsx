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
    </div>
  );
}
