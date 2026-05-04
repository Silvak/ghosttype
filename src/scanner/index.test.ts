import { describe, it, expect } from 'vitest';
import { scan } from './index.js';

// ────────────────────────────────────────────────────────────────
// Empty / trivial inputs
// ────────────────────────────────────────────────────────────────

describe('scan — empty input', () => {
  it('returns zero signals and zero riskScore for empty string', () => {
    const result = scan('', 'soft');
    expect(result.signals).toHaveLength(0);
    expect(result.riskScore).toBe(0);
  });

  it('returns zero signals for whitespace-only input', () => {
    const result = scan('   \n  ', 'medium');
    expect(result.signals).toHaveLength(0);
    expect(result.riskScore).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────
// Soft level — direct identifiers
// ────────────────────────────────────────────────────────────────

describe('scan — soft level', () => {
  it('detects an email address', () => {
    const result = scan('Contact me at john.doe@example.com for details.', 'soft');
    const emails = result.signals.filter(s => s.category === 'email');
    expect(emails).toHaveLength(1);
    expect(emails[0].match).toBe('john.doe@example.com');
  });

  it('detects a phone number', () => {
    const result = scan('Call me at +1 555-867-5309 anytime.', 'soft');
    const phones = result.signals.filter(s => s.category === 'phone');
    expect(phones.length).toBeGreaterThanOrEqual(1);
  });

  it('detects a URL', () => {
    const result = scan('Check out https://myportfolio.dev/about for my work.', 'soft');
    const urls = result.signals.filter(s => s.category === 'url');
    expect(urls).toHaveLength(1);
  });

  it('detects a proper name', () => {
    const result = scan('I talked to John Smith about the project.', 'soft');
    const names = result.signals.filter(s => s.category === 'name');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('produces a riskScore > 0 when signals are found', () => {
    const result = scan('Send invoice to alice@corp.io.', 'soft');
    expect(result.riskScore).toBeGreaterThan(0);
  });

  it('does NOT detect location at soft level', () => {
    const result = scan('I live in Madrid and love it here.', 'soft');
    const locations = result.signals.filter(s => s.category === 'location');
    expect(locations).toHaveLength(0);
  });

  it('does NOT detect technology at soft level', () => {
    const result = scan('I use React and TypeScript daily.', 'soft');
    const tech = result.signals.filter(s => s.category === 'technology');
    expect(tech).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────
// Medium level
// ────────────────────────────────────────────────────────────────

describe('scan — medium level', () => {
  it('detects a city', () => {
    const result = scan('I am based in Berlin working remotely.', 'medium');
    const locations = result.signals.filter(s => s.category === 'location');
    expect(locations.length).toBeGreaterThanOrEqual(1);
  });

  it('detects a country', () => {
    const result = scan('I am from Spain and moved recently.', 'medium');
    const locations = result.signals.filter(s => s.category === 'location');
    expect(locations.length).toBeGreaterThanOrEqual(1);
  });

  it('detects a profession', () => {
    const result = scan('As an engineer I deal with this daily.', 'medium');
    const professions = result.signals.filter(s => s.category === 'profession');
    expect(professions.length).toBeGreaterThanOrEqual(1);
  });

  it('detects a technology', () => {
    const result = scan('We migrated everything to Kubernetes last month.', 'medium');
    const tech = result.signals.filter(s => s.category === 'technology');
    expect(tech.length).toBeGreaterThanOrEqual(1);
  });

  it('detects temporal expressions', () => {
    const result = scan('Back in 2019 I started my company.', 'medium');
    const temporal = result.signals.filter(s => s.category === 'temporal');
    expect(temporal.length).toBeGreaterThanOrEqual(1);
  });

  it('detects "yesterday" as temporal', () => {
    const result = scan('I deployed it yesterday and it broke.', 'medium');
    const temporal = result.signals.filter(s => s.category === 'temporal');
    expect(temporal.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT detect dialect signals at medium level', () => {
    const result = scan("Mate, you should check this innit.", 'medium');
    const dialects = result.signals.filter(s => s.category === 'dialect');
    expect(dialects).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────
// Strong level
// ────────────────────────────────────────────────────────────────

describe('scan — strong level', () => {
  it('detects dialect markers in English', () => {
    const result = scan("Y'all should come check this out, it's wicked good.", 'strong');
    const dialects = result.signals.filter(s => s.category === 'dialect');
    expect(dialects.length).toBeGreaterThanOrEqual(1);
  });

  it('detects Spanish regional slang', () => {
    const result = scan('Che, boludo, hay que laburar.', 'strong');
    const dialects = result.signals.filter(s => s.category === 'dialect');
    expect(dialects.length).toBeGreaterThanOrEqual(2);
  });

  it('includes all medium-level signals too', () => {
    const result = scan('I am an engineer based in London using React.', 'strong');
    const categories = new Set(result.signals.map(s => s.category));
    expect(categories.has('profession')).toBe(true);
    expect(categories.has('location')).toBe(true);
    expect(categories.has('technology')).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// Deduplication
// ────────────────────────────────────────────────────────────────

describe('scan — deduplication', () => {
  it('does not double-count the same signal string', () => {
    const result = scan(
      'Contact alice@test.com or alice@test.com for more info.',
      'soft',
    );
    const emails = result.signals.filter(s => s.category === 'email');
    expect(emails).toHaveLength(1);
  });
});

// ────────────────────────────────────────────────────────────────
// riskScore boundaries
// ────────────────────────────────────────────────────────────────

describe('scan — riskScore', () => {
  it('riskScore is 0 when no signals found', () => {
    const result = scan('The weather is nice today.', 'soft');
    expect(result.riskScore).toBe(0);
  });

  it('riskScore does not exceed 100', () => {
    const heavy = Array.from({ length: 20 })
      .map((_, i) => `user${i}@corp.com`)
      .join(', ');
    const result = scan(heavy, 'strong');
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it('riskScore is higher for high-severity signals than low-severity only', () => {
    const emailResult = scan('Reach me at admin@example.org.', 'soft');
    const techResult = scan('I use React daily.', 'medium');
    expect(emailResult.riskScore).toBeGreaterThan(techResult.riskScore);
  });
});
