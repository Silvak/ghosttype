import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/options/Sidebar.js';
import { GeneralSection } from '../../components/options/GeneralSection.js';
import { ModelsSection } from '../../components/options/ModelsSection.js';
import { ApiSection } from '../../components/options/ApiSection.js';
import { AboutSection } from '../../components/options/AboutSection.js';
import { EngineStatusCard } from '../../components/options/EngineStatusCard.js';
import { parseOptionsSectionFromHash, type Section } from '../../utils/navigate-options.js';

export type { Section };

function initialSection(): Section {
  return parseOptionsSectionFromHash() ?? 'general';
}

export function App() {
  const [section, setSection] = useState<Section>(initialSection);

  useEffect(() => {
    const fromHash = parseOptionsSectionFromHash();
    if (fromHash) setSection(fromHash);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = parseOptionsSectionFromHash();
      if (next) setSection(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#111113]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/80 px-6 py-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-zinc-100">GhostType</span>
            <span className="hidden text-xs text-zinc-500 sm:inline">Opciones</span>
          </div>
          <p className="text-xs leading-snug text-zinc-500">
            Panel de configuración en pestaña completa. Usa el menú lateral: Modelos para
            descargas locales, API para claves externas.
          </p>
        </div>
        <EngineStatusCard />
      </header>

      <div className="flex flex-1">
        <Sidebar active={section} onChange={setSection} />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-2xl">
            {section === 'general' && <GeneralSection />}
            {section === 'models' && <ModelsSection />}
            {section === 'api' && <ApiSection />}
            {section === 'about' && <AboutSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
