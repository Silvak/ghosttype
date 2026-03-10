import { useState, useEffect } from 'react';
import type { GhostScore } from '@/types';

export default function App() {
  const [score, setScore] = useState<GhostScore | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Stub — en Fase 2 se conecta al background via chrome.runtime.sendMessage
  }, []);

  return (
    <div className="w-72 min-h-32 bg-gray-950 text-white p-4 font-mono">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-bold tracking-widest uppercase text-gray-400">
          GhostType
        </h1>
        <button
          onClick={() => setIsActive((v) => !v)}
          className={`text-xs px-2 py-1 rounded ${
            isActive
              ? 'bg-green-900 text-green-300'
              : 'bg-gray-800 text-gray-500'
          }`}
        >
          {isActive ? 'Activo' : 'Inactivo'}
        </button>
      </header>

      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl font-bold text-gray-200">
          {score ? score.value : '--'}
        </div>
        <p className="text-xs text-gray-500">Ghost Score</p>

        {score && score.leaks.length > 0 && (
          <p className="text-xs text-amber-400">
            {score.leaks.length} entidad{score.leaks.length > 1 ? 'es' : ''} detectada
            {score.leaks.length > 1 ? 's' : ''}
          </p>
        )}

        {!score && (
          <p className="text-xs text-gray-600 text-center">
            Escribe en un cuadro de texto para analizar tu huella estilística.
          </p>
        )}
      </div>
    </div>
  );
}
