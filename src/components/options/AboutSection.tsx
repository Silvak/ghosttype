const PRINCIPLES = [
  {
    title: 'Zero telemetría',
    desc: 'No se envían datos a ningún servidor. Todo el procesamiento es local salvo que configures una API externa.',
  },
  {
    title: 'Sin texto almacenado',
    desc: 'GhostType nunca guarda el texto que escribes. Solo se persisten configuraciones y el modelo cacheado.',
  },
  {
    title: 'Control total del usuario',
    desc: 'Ningún modelo se descarga automáticamente. Ninguna API key se envía sin tu confirmación explícita.',
  },
  {
    title: 'Permisos mínimos',
    desc: 'La extensión usa activeTab, storage y sidePanel. Sin host_permissions globales.',
  },
];

export function AboutSection() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-base font-semibold text-zinc-100">Acerca de GhostType</h2>
        <p className="text-sm text-zinc-400">
          Escritura anónima para la era de la IA. Protege tu huella lingüística mientras
          interactúas en foros, redes sociales y servicios online.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-zinc-500">Versión</dt>
          <dd className="text-zinc-200">0.1.0 (Fase 2)</dd>
          <dt className="text-zinc-500">Manifest</dt>
          <dd className="text-zinc-200">MV3</dd>
          <dt className="text-zinc-500">Motor de inferencia</dt>
          <dd className="text-zinc-200">@huggingface/transformers 3.8</dd>
          <dt className="text-zinc-500">Base de datos</dt>
          <dd className="text-zinc-200">Dexie 4 (IndexedDB)</dd>
        </dl>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-300">Principios de privacidad</h3>
        {PRINCIPLES.map(p => (
          <div
            key={p.title}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
          >
            <p className="text-xs font-semibold text-zinc-200">{p.title}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{p.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Las API keys se ofuscan con AES-GCM + PBKDF2 en IndexedDB. Esto evita exposición trivial
        pero no protege contra acceso directo al perfil del navegador.
      </p>
    </div>
  );
}
