interface EngineStatusProps {
  status?: 'none' | 'local' | 'api';
  detail?: string;
}

export function EngineStatus({ status = 'none', detail }: EngineStatusProps) {
  const map = {
    none: { color: 'bg-zinc-700/40 text-zinc-400 border-zinc-700', label: 'Sin engine configurado' },
    local: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40', label: detail ?? 'Local' },
    api: { color: 'bg-sky-500/10 text-sky-400 border-sky-500/40', label: detail ?? 'API' },
  } as const;
  const cfg = map[status];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
