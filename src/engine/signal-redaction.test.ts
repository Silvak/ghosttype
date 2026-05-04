import { describe, it, expect } from 'vitest';
import { redactKnownSignals } from './signal-redaction.js';
import type { Signal } from '../types/index.js';

function sig(
  category: Signal['category'],
  match: string,
  start: number,
  end: number,
): Signal {
  return { category, match, severity: 'high', start, end };
}

describe('redactKnownSignals', () => {
  it('redacts email and name', () => {
    const text = 'Hola soy Jesus Silva silca@gmail.com';
    const signals = [
      sig('name', 'Jesus Silva', 9, 20),
      sig('email', 'silca@gmail.com', 21, 36),
    ];
    const out = redactKnownSignals(text, signals, 'soft');
    expect(out).not.toContain('silca@gmail.com');
    expect(out).not.toContain('Jesus Silva');
    expect(out).toContain('[correo]');
    expect(out).toContain('[nombre]');
  });

  it('replaces longer matches before shorter ones to avoid partial corruption', () => {
    const text = 'foo@bar.com and foo';
    const signals = [sig('email', 'foo@bar.com', 0, 11), sig('name', 'foo', 16, 19)];
    const out = redactKnownSignals(text, signals, 'medium');
    expect(out).toMatch(/\[correo\]/);
    expect(out).not.toContain('foo@bar.com');
  });

  it('uses strong placeholders for name and location', () => {
    const text = 'Vivo en Atlanta';
    const signals = [sig('location', 'Atlanta', 9, 16)];
    expect(redactKnownSignals(text, signals, 'strong')).toContain('[ubicación]');
    expect(redactKnownSignals(text, signals, 'soft')).toContain('[zona]');
  });

  it('returns original when no signals', () => {
    expect(redactKnownSignals('unchanged', [], 'soft')).toBe('unchanged');
  });
});
