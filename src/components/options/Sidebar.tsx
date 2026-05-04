import type { Section } from '../../entrypoints/options/App.js';

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '⚙' },
  { id: 'models', label: 'Modelos', icon: '🧠' },
  { id: 'api', label: 'API', icon: '🔑' },
  { id: 'about', label: 'Acerca de', icon: 'ℹ' },
];

interface SidebarProps {
  active: Section;
  onChange: (s: Section) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <nav className="w-48 shrink-0 border-r border-zinc-800 bg-zinc-950/60 p-4">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active === item.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
