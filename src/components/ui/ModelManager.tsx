import { MODEL_CATALOG } from '../../engine/models.js';

const QUALITY_LABEL = {
  basic: 'Calidad básica',
  medium: 'Calidad media',
  high: 'Calidad alta',
} as const;

export function ModelManager() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-400">
        Descarga manual. Los modelos se ejecutan localmente en tu navegador.
      </p>
      <div className="flex flex-col gap-2">
        {MODEL_CATALOG.map(model => (
          <article
            key={model.id}
            className="flex flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-900/40 p-3"
          >
            <header className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-zinc-100">{model.label}</h4>
                <span className="text-[11px] text-zinc-500">{model.repo}</span>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                {model.sizeMB} MB
              </span>
            </header>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-400">
              <dt>Calidad</dt>
              <dd className="text-zinc-200">{QUALITY_LABEL[model.quality]}</dd>
              <dt>WebGPU</dt>
              <dd className="text-zinc-200">{model.latencyHint.webgpu}</dd>
              <dt>WASM</dt>
              <dd className="text-zinc-200">{model.latencyHint.wasm}</dd>
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                disabled
                title="Disponible en Fase 2"
                className="flex-1 cursor-not-allowed rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-500"
              >
                Descargar
              </button>
              <button
                type="button"
                disabled
                title="Disponible en Fase 2"
                className="flex-1 cursor-not-allowed rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-500"
              >
                Activar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
