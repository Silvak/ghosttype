import type { PrivacyLevel, Signal, SignalCategory } from '../types/index.js';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function placeholderFor(category: SignalCategory, level: PrivacyLevel): string {
  const strong = level === 'strong';
  switch (category) {
    case 'email':
      return '[correo]';
    case 'phone':
      return '[teléfono]';
    case 'name':
      return strong ? '[persona]' : '[nombre]';
    case 'location':
      return strong ? '[ubicación]' : '[zona]';
    case 'url':
      return '[enlace]';
    case 'profession':
      return '[profesión]';
    case 'technology':
      return '[herramienta]';
    case 'temporal':
      return '[fecha]';
    case 'dialect':
      return '[detalle lingüístico]';
    default:
      return '[dato]';
  }
}

/**
 * Replaces scanner matches in `text` with stable placeholders (longest match first).
 * Does not run the model; use after model output or as fallback when inference fails.
 */
export function redactKnownSignals(text: string, signals: Signal[], _level: PrivacyLevel): string {
  if (!text || signals.length === 0) return text;

  const sorted = [...signals].sort((a, b) => b.match.length - a.match.length);
  let out = text;

  for (const s of sorted) {
    const m = s.match.trim();
    if (m.length === 0) continue;
    const ph = placeholderFor(s.category, _level);
    const re = new RegExp(escapeRegExp(m), 'gi');
    out = out.replace(re, ph);
  }

  return out;
}
