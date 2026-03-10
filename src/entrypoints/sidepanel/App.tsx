import { useState, useEffect } from 'react';
import type { GhostScore, LeakEntity } from '@/types';

type Tab = 'score' | 'leaks' | 'rewrite' | 'settings';

const LEVEL_COLOR: Record<string, string> = {
  ghost: '#4ade80',
  warning: '#facc15',
  exposed: '#f87171',
};

const RISK_COLOR: Record<string, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

const RISK_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('score');
  const [score, setScore] = useState<GhostScore | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    browser.storage.local.get(['lastScore', 'isActive']).then((result) => {
      if (result.lastScore) setScore(result.lastScore as GhostScore);
      if (result.isActive !== undefined) setIsActive(result.isActive as boolean);
    });

    const listener = (changes: Record<string, browser.storage.StorageChange>) => {
      if (changes.lastScore?.newValue) {
        setScore(changes.lastScore.newValue as GhostScore);
      }
      if (changes.isActive?.newValue !== undefined) {
        setIsActive(changes.isActive.newValue as boolean);
      }
    };

    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  const handleToggle = async () => {
    const next = !isActive;
    setIsActive(next);
    await browser.storage.local.set({ isActive: next });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'score', label: 'Score' },
    { id: 'leaks', label: `Leaks${score && score.leaks.length > 0 ? ` (${score.leaks.length})` : ''}` },
    { id: 'rewrite', label: 'Cloak' },
    { id: 'settings', label: 'Config' },
  ];

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col font-mono">
      <header className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xs font-bold tracking-widest uppercase text-gray-400">
          GhostType
        </h1>
        <button
          onClick={handleToggle}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isActive ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </button>
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

// ─── Score Tab ───────────────────────────────────────────────────────────────

function ScoreTab({ score }: { score: GhostScore | null }) {
  const color = score ? LEVEL_COLOR[score.level] : '#6b7280';
  const levelLabel = score
    ? { ghost: 'Ghost — High Anonymity', warning: 'Warning — Medium Risk', exposed: 'Exposed — Identifiable' }[score.level]
    : null;

  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const offset = score ? CIRC * (1 - score.value / 100) : CIRC;

  return (
    <div className="flex flex-col items-center gap-4 pt-6">
      {/* Large ring */}
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
        />
        <text
          x="70" y="70"
          fill={color}
          fontSize="26"
          fontWeight="700"
          fontFamily="ui-monospace, monospace"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {score ? score.value : '--'}
        </text>
      </svg>

      <p className="text-xs uppercase tracking-widest" style={{ color }}>
        {levelLabel ?? 'No data yet'}
      </p>

      {!score && (
        <p className="text-xs text-gray-600 text-center max-w-52 mt-2">
          Type in a text box on Reddit, Twitter, or Hacker News to see your real-time analysis.
        </p>
      )}

      {score && (
        <div className="w-full mt-2 bg-gray-900 rounded p-3 text-xs text-gray-400">
          <p>
            <span className="text-gray-500">Leaks detected: </span>
            <span style={{ color }}>{score.leaks.length}</span>
          </p>
          <p className="mt-1">
            <span className="text-gray-500">Last analysis: </span>
            <span>{new Date(score.timestamp).toLocaleTimeString()}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Leaks Tab ───────────────────────────────────────────────────────────────

function LeaksTab({ leaks }: { leaks: LeakEntity[] }) {
  if (leaks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 pt-8">
        <div className="text-2xl">👻</div>
        <p className="text-xs text-gray-500 text-center">
          No identity leaks detected in the current text.
        </p>
      </div>
    );
  }

  const grouped = leaks.reduce<Record<string, LeakEntity[]>>((acc, leak) => {
    if (!acc[leak.category]) acc[leak.category] = [];
    acc[leak.category].push(leak);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">
        {leaks.length} leak{leaks.length > 1 ? 's' : ''} found
      </p>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">
            {category}
          </p>
          <div className="flex flex-col gap-1.5">
            {items.map((leak, i) => (
              <div key={i} className="bg-gray-900 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: RISK_COLOR[leak.risk],
                      background: `${RISK_COLOR[leak.risk]}18`,
                    }}
                  >
                    {RISK_LABEL[leak.risk]}
                  </span>
                  <span className="text-xs text-white font-bold">&ldquo;{leak.text}&rdquo;</span>
                </div>
                {leak.suggestion && (
                  <p className="text-xs text-gray-500 leading-relaxed">{leak.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Rewrite Tab ─────────────────────────────────────────────────────────────

function RewriteTab() {
  return (
    <div className="flex flex-col items-center gap-4 pt-8">
      <p className="text-xs text-gray-600 uppercase tracking-widest">Coming in Phase 3</p>
      <p className="text-xs text-gray-700 text-center max-w-52">
        Adversarial Rewriting will use a local SLM to propose anonymized versions of your text.
      </p>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Settings</p>
      <p className="text-xs text-gray-700">Advanced settings available in Phase 3.</p>
    </div>
  );
}
