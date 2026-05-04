import { useEffect, useState, useCallback } from 'react';
import { MODEL_CATALOG } from '../../engine/models.js';
import { list, download, remove, setActive } from '../../engine/model-manager.js';
import type { ModelListEntry } from '../../engine/model-manager.js';

const QUALITY_LABEL = {
  basic: 'Básica',
  medium: 'Media',
  high: 'Alta',
} as const;

export function ModelsSection() {
  const [models, setModels] = useState<ModelListEntry[]>([]);

  const refreshList = useCallback(async () => {
    setModels(await list());
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  async function handleDownload(id: string) {
    // Optimistically mark as downloading
    setModels(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'downloading', progress: 0 } : m)),
    );

    try {
      await download(id, (_modelId, progress) => {
        setModels(prev => prev.map(m => (m.id === id ? { ...m, progress } : m)));
      });
      await refreshList();
    } catch (err) {
      console.error('[GhostType options] download failed:', err);
      await refreshList();
    }
  }

  async function handleRemove(id: string) {
    await remove(id);
    await refreshList();
  }

  async function handleActivate(id: string) {
    await setActive(id);
    await refreshList();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-base font-semibold text-zinc-100">Modelos locales</h2>
        <p className="text-sm text-zinc-400">
          Descarga un modelo ONNX para reescribir texto localmente. Ningún texto sale de tu
          navegador.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {MODEL_CATALOG.map(catalogEntry => {
          const m = models.find(x => x.id === catalogEntry.id) ?? {
            ...catalogEntry,
            status: 'not-downloaded' as const,
          };

          return (
            <article
              key={m.id}
              className={`rounded-lg border p-4 transition-colors ${
                m.status === 'active'
                  ? 'border-emerald-700/60 bg-emerald-900/10'
                  : 'border-zinc-800 bg-zinc-900/40'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">{m.label}</h3>
                    {m.status === 'active' && (
                      <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                        Activo
                      </span>
                    )}
                    {m.status === 'downloaded' && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Descargado
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{m.repo}</p>
                </div>
                <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                  {m.sizeMB} MB
                </span>
              </div>

              <dl className="mb-3 grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-zinc-400">
                <dt>Calidad</dt>
                <dt>WebGPU</dt>
                <dt>WASM</dt>
                <dd className="text-zinc-200">{QUALITY_LABEL[m.quality]}</dd>
                <dd className="text-zinc-200">{m.latencyHint.webgpu}</dd>
                <dd className="text-zinc-200">{m.latencyHint.wasm}</dd>
              </dl>

              {/* Progress bar */}
              {m.status === 'downloading' && (
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-zinc-400">
                    <span>Descargando…</span>
                    <span>{m.progress ?? 0}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${m.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {m.status === 'not-downloaded' && (
                  <button
                    type="button"
                    onClick={() => void handleDownload(m.id)}
                    className="flex-1 rounded border border-sky-700/60 bg-sky-900/20 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-opacity hover:opacity-80"
                  >
                    Descargar
                  </button>
                )}
                {m.status === 'downloading' && (
                  <button
                    type="button"
                    disabled
                    className="flex-1 cursor-not-allowed rounded border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs text-zinc-500"
                  >
                    Descargando…
                  </button>
                )}
                {(m.status === 'downloaded' || m.status === 'active') && (
                  <>
                    {m.status === 'downloaded' && (
                      <button
                        type="button"
                        onClick={() => void handleActivate(m.id)}
                        className="flex-1 rounded border border-emerald-700/60 bg-emerald-900/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-opacity hover:opacity-80"
                      >
                        Activar
                      </button>
                    )}
                    {m.status === 'active' && (
                      <button
                        type="button"
                        disabled
                        className="flex-1 cursor-not-allowed rounded border border-emerald-700/40 bg-emerald-900/10 px-3 py-1.5 text-xs text-emerald-500"
                      >
                        En uso
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleRemove(m.id)}
                      className="rounded border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs text-zinc-400 transition-opacity hover:opacity-80"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
