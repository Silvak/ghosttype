import { useState } from 'react';
import type { GhostScore, LeakEntity } from '@/types';

type Tab = 'score' | 'leaks' | 'rewrite' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('score');
  const [score] = useState<GhostScore | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'score', label: 'Score' },
    { id: 'leaks', label: 'Leaks' },
    { id: 'rewrite', label: 'Cloak' },
    { id: 'settings', label: 'Config' },
  ];

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col font-mono">
      <header className="px-4 py-3 border-b border-gray-800">
        <h1 className="text-xs font-bold tracking-widest uppercase text-gray-400">
          GhostType
        </h1>
      </header>

      <nav className="flex border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'score' && <ScoreTab score={score} />}
        {activeTab === 'leaks' && <LeaksTab leaks={score?.leaks ?? []} />}
        {activeTab === 'rewrite' && <RewriteTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

function ScoreTab({ score }: { score: GhostScore | null }) {
  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      <div className="text-7xl font-bold text-gray-200">
        {score ? score.value : '--'}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-widest">Ghost Score</p>
      {!score && (
        <p className="text-xs text-gray-600 text-center max-w-48">
          Escribe en un cuadro de texto para ver tu análisis en tiempo real.
        </p>
      )}
    </div>
  );
}

function LeaksTab({ leaks }: { leaks: LeakEntity[] }) {
  if (leaks.length === 0) {
    return (
      <p className="text-xs text-gray-600 text-center pt-8">
        No se han detectado fugas de identidad.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {leaks.map((leak, i) => (
        <li key={i} className="bg-gray-900 rounded p-3 text-xs">
          <span className="text-amber-400 font-bold">{leak.text}</span>
          <span className="text-gray-500 ml-2">{leak.category}</span>
        </li>
      ))}
    </ul>
  );
}

function RewriteTab() {
  return (
    <div className="flex flex-col items-center gap-4 pt-8">
      <p className="text-xs text-gray-600 text-center">
        Adversarial Rewriting disponible en Fase 3.
      </p>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Configuración</p>
      <p className="text-xs text-gray-600">Opciones disponibles en Fase 3.</p>
    </div>
  );
}
