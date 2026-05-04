import type { PrivacyLevel } from '../../types/index.js';

interface LevelOption {
  id: PrivacyLevel;
  label: string;
  description: string;
}

const OPTIONS: LevelOption[] = [
  {
    id: 'soft',
    label: 'Suave',
    description: 'Solo identificadores directos: emails, teléfonos, URLs y nombres.',
  },
  {
    id: 'medium',
    label: 'Medio',
    description: 'Añade ubicación, profesión, tecnologías y referencias temporales.',
  },
  {
    id: 'strong',
    label: 'Fuerte',
    description: 'Máxima protección: incluye dialectos y patrones regionales.',
  },
];

interface LevelSelectorProps {
  value: PrivacyLevel;
  onChange: (next: PrivacyLevel) => void;
}

export function LevelSelector({ value, onChange }: LevelSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Nivel de privacidad
      </h3>
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map(opt => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500'
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-zinc-100">{opt.label}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    active ? 'bg-emerald-400' : 'bg-zinc-600'
                  }`}
                />
              </span>
              <span className="text-xs leading-snug text-zinc-400">{opt.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
