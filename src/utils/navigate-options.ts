export type OptionsSection = 'general' | 'models' | 'api' | 'about';

/** Misma unión que usa el sidebar de opciones */
export type Section = OptionsSection;

export function parseOptionsSectionFromHash(): OptionsSection | null {
  const raw = window.location.hash.replace(/^#/, '').toLowerCase();
  if (raw === 'models' || raw === 'modelos') return 'models';
  if (raw === 'api') return 'api';
  if (raw === 'about' || raw === 'acerca') return 'about';
  if (raw === 'general') return 'general';
  return null;
}

export function getOptionsPageUrl(section: OptionsSection = 'general'): string {
  const hash = section === 'general' ? '' : `#${section}`;
  return chrome.runtime.getURL(`options.html${hash}`);
}

/**
 * Abre siempre una pestaña completa del navegador (no el panel embebido de opciones),
 * con la sección indicada en el hash.
 */
export async function openOptionsToSection(section: OptionsSection = 'general'): Promise<void> {
  const url = getOptionsPageUrl(section);
  await chrome.tabs.create({ url, active: true });
}
