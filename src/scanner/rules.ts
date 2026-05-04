import type { Signal, SignalCategory, SignalSeverity, PrivacyLevel } from '../types/index.js';
import {
  EMAIL_RE,
  PHONE_RE,
  URL_RE,
  PROPER_NAME_RE,
  CITIES,
  COUNTRIES,
  LOCATION_WORD_RE,
  PROFESSION_TITLES,
  TECHNOLOGIES,
  TEMPORAL_RE,
  DIALECT_MARKERS,
  DIALECT_RE,
} from './patterns.js';

interface RuleMatch {
  category: SignalCategory;
  severity: SignalSeverity;
  match: string;
  start: number;
  end: number;
}

/** Run a RegExp (with /g flag) and collect all matches as RuleMatch entries. */
function collectRegex(
  text: string,
  re: RegExp,
  category: SignalCategory,
  severity: SignalSeverity,
): RuleMatch[] {
  const results: RuleMatch[] = [];
  // Reset lastIndex before use — patterns module exports shared references
  const localRe = new RegExp(re.source, re.flags);
  let m: RegExpExecArray | null;
  while ((m = localRe.exec(text)) !== null) {
    results.push({ category, severity, match: m[0], start: m.index, end: m.index + m[0].length });
  }
  return results;
}

/**
 * Scan for locations by matching lowercase words/bigrams against the city and
 * country Sets. Also detect "live in / based in / from" proximity patterns.
 */
function collectLocations(text: string): RuleMatch[] {
  const results: RuleMatch[] = [];
  const lower = text.toLowerCase();

  // Check bigrams and single tokens against city/country sets
  const tokens = lower.match(/\b[a-záéíóúüñ\s]{2,}\b/gi) ?? [];
  for (const city of CITIES) {
    const idx = lower.indexOf(city);
    if (idx !== -1) {
      results.push({ category: 'location', severity: 'medium', match: city, start: idx, end: idx + city.length });
    }
  }
  for (const country of COUNTRIES) {
    const idx = lower.indexOf(country);
    if (idx !== -1) {
      results.push({ category: 'location', severity: 'medium', match: country, start: idx, end: idx + country.length });
    }
  }

  // Detect "I live in X", "based in X" patterns
  const locRe = new RegExp(LOCATION_WORD_RE.source, LOCATION_WORD_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = locRe.exec(text)) !== null) {
    results.push({ category: 'location', severity: 'medium', match: m[0], start: m.index, end: m.index + m[0].length });
  }

  void tokens; // used indirectly via lower.indexOf above
  return results;
}

/** Scan for profession/title words. */
function collectProfessions(text: string): RuleMatch[] {
  const results: RuleMatch[] = [];
  const wordRe = /\b[a-záéíóúüñ\-]{3,30}\b/gi;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(text)) !== null) {
    if (PROFESSION_TITLES.has(m[0].toLowerCase())) {
      results.push({ category: 'profession', severity: 'medium', match: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return results;
}

/** Scan for technology names. */
function collectTechnologies(text: string): RuleMatch[] {
  const results: RuleMatch[] = [];
  const wordRe = /\b[a-z][a-z0-9.\-]{1,30}\b/gi;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(text)) !== null) {
    if (TECHNOLOGIES.has(m[0].toLowerCase())) {
      results.push({ category: 'technology', severity: 'low', match: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return results;
}

/** Scan for dialect markers (Set lookup + regex). */
function collectDialects(text: string): RuleMatch[] {
  const results: RuleMatch[] = [];

  // Set-based single-word lookup
  const wordRe = /\b[a-záéíóúüñ']{2,30}\b/gi;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(text)) !== null) {
    if (DIALECT_MARKERS.has(m[0].toLowerCase())) {
      results.push({ category: 'dialect', severity: 'low', match: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  // Regex-based multi-word markers
  results.push(...collectRegex(text, DIALECT_RE, 'dialect', 'low'));

  return results;
}

// ────────────────────────────────────────────────────────────────
// Main rule runner
// ────────────────────────────────────────────────────────────────

export function applyRules(text: string, level: PrivacyLevel): Signal[] {
  const raw: RuleMatch[] = [];

  // Soft — always active
  raw.push(...collectRegex(text, EMAIL_RE, 'email', 'high'));
  raw.push(...collectRegex(text, PHONE_RE, 'phone', 'high'));
  raw.push(...collectRegex(text, URL_RE, 'url', 'medium'));
  raw.push(...collectRegex(text, PROPER_NAME_RE, 'name', 'high'));

  if (level === 'medium' || level === 'strong') {
    raw.push(...collectLocations(text));
    raw.push(...collectProfessions(text));
    raw.push(...collectTechnologies(text));
    raw.push(...collectRegex(text, TEMPORAL_RE, 'temporal', 'low'));
  }

  if (level === 'strong') {
    raw.push(...collectDialects(text));
  }

  // Deduplicate by exact match string + category to avoid score inflation
  const seen = new Set<string>();
  const deduped: Signal[] = [];
  for (const item of raw) {
    const key = `${item.category}:${item.match.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push({
        category: item.category,
        match: item.match,
        severity: item.severity,
        start: item.start,
        end: item.end,
      });
    }
  }

  return deduped;
}

const SEVERITY_WEIGHT: Record<SignalSeverity, number> = {
  high: 30,
  medium: 15,
  low: 5,
};

/** Calculate riskScore (0–100) from a list of signals. */
export function calcRiskScore(signals: Signal[]): number {
  if (signals.length === 0) return 0;
  const raw = signals.reduce((acc, s) => acc + SEVERITY_WEIGHT[s.severity], 0);
  return Math.min(100, raw);
}
