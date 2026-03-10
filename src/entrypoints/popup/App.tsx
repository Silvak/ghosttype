import { useState, useEffect } from 'react';
import type { GhostScore } from '@/types';

const RISK_COLOR: Record<string, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

const LEVEL_COLOR: Record<string, string> = {
  ghost: '#4ade80',
  warning: '#facc15',
  exposed: '#f87171',
};

export default function App() {
  const [score, setScore] = useState<GhostScore | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Load initial state from storage
  useEffect(() => {
    browser.storage.local.get(['lastScore', 'isActive']).then((result) => {
      if (result.lastScore) setScore(result.lastScore as GhostScore);
      if (result.isActive !== undefined) setIsActive(result.isActive as boolean);
    });

    // Listen for real-time updates
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

  const scoreColor = score ? LEVEL_COLOR[score.level] : '#6b7280';
  const levelLabel = score
    ? { ghost: 'Ghost', warning: 'Warning', exposed: 'Exposed' }[score.level]
    : null;

  return (
    <div className="w-72 bg-gray-950 text-white p-4 font-mono">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-bold tracking-widest uppercase text-gray-400">
          GhostType
        </h1>
        <button
          onClick={handleToggle}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isActive
              ? 'bg-green-900 text-green-300'
              : 'bg-gray-800 text-gray-500'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </button>
      </header>

      {/* Score display */}
      <div className="flex flex-col items-center gap-1 mb-4">
        <ScoreRing value={score?.value ?? null} color={scoreColor} />
        <p className="text-xs uppercase tracking-widest" style={{ color: scoreColor }}>
          {levelLabel ?? 'No data yet'}
        </p>
      </div>

      {/* Leak list */}
      {score && score.leaks.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {score.leaks.length} leak{score.leaks.length > 1 ? 's' : ''} detected
          </p>
          {score.leaks.slice(0, 4).map((leak, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-gray-900 rounded px-2 py-1.5"
              title={leak.suggestion}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: RISK_COLOR[leak.risk] }}
              />
              <span className="text-xs text-gray-200 truncate">
                &ldquo;{leak.text}&rdquo;
              </span>
              <span className="text-xs text-gray-600 ml-auto flex-shrink-0 uppercase">
                {leak.category}
              </span>
            </div>
          ))}
          {score.leaks.length > 4 && (
            <p className="text-xs text-gray-600 text-center">
              +{score.leaks.length - 4} more — open side panel
            </p>
          )}
        </div>
      ) : (
        !score && (
          <p className="text-xs text-gray-600 text-center">
            Type in a text box on Reddit, Twitter, or HN to analyze your linguistic fingerprint.
          </p>
        )
      )}

      {score && score.leaks.length === 0 && (
        <p className="text-xs text-center" style={{ color: scoreColor }}>
          No identity leaks detected.
        </p>
      )}
    </div>
  );
}

function ScoreRing({ value, color }: { value: number | null; color: string }) {
  const R = 28;
  const CIRC = 2 * Math.PI * R;
  const offset = value !== null ? CIRC * (1 - value / 100) : CIRC;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle
        cx="36" cy="36" r={R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="5"
      />
      <circle
        cx="36" cy="36" r={R}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
      />
      <text
        x="36" y="36"
        fill={color}
        fontSize="14"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {value !== null ? value : '--'}
      </text>
    </svg>
  );
}
