import { useState } from 'react';
import { Sidebar } from '../../components/options/Sidebar.js';
import { GeneralSection } from '../../components/options/GeneralSection.js';
import { ModelsSection } from '../../components/options/ModelsSection.js';
import { ApiSection } from '../../components/options/ApiSection.js';
import { AboutSection } from '../../components/options/AboutSection.js';
import { EngineStatusCard } from '../../components/options/EngineStatusCard.js';

export type Section = 'general' | 'models' | 'api' | 'about';

export function App() {
  const [section, setSection] = useState<Section>('general');

  return (
    <div className="flex min-h-screen flex-col bg-[#111113]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-zinc-100">GhostType</span>
          <span className="text-xs text-zinc-500">Opciones</span>
        </div>
        <EngineStatusCard compact />
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar active={section} onChange={setSection} />

        {/* Main content */}
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
