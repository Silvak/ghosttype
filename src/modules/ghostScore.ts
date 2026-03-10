import type { GhostScore, LeakEntity } from '@/types';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

const BASE_PENALTY: Record<string, number> = {
  low: 2,
  medium: 8,
  high: 15,
  critical: 30,
};

export function calculateGhostScore(
  currentEmbedding: number[],
  baseProfile: number[] | null,
  leaks: LeakEntity[],
  rawText = ''
): GhostScore {
  let value = 100;

  // ── Similarity penalty (Phase 2+, inactive when baseProfile is null) ──────
  if (baseProfile && currentEmbedding.length > 0) {
    const similarity = cosineSimilarity(currentEmbedding, baseProfile);
    value -= Math.round(similarity * 50);
  }

  if (leaks.length === 0) {
    value = Math.max(0, Math.min(100, value));
    const level: GhostScore['level'] = value >= 80 ? 'ghost' : value >= 50 ? 'warning' : 'exposed';
    return { value, level, leaks, timestamp: Date.now() };
  }

  // ── Repetition discount: same text penalizes fully only once ──────────────
  const seenTexts = new Map<string, number>();
  let basePenalty = 0;
  for (const leak of leaks) {
    const key = leak.text.toLowerCase();
    const count = seenTexts.get(key) ?? 0;
    seenTexts.set(key, count + 1);
    const penalty = BASE_PENALTY[leak.risk] ?? 8;
    // First occurrence: full penalty. Subsequent: 25%
    basePenalty += count === 0 ? penalty : penalty * 0.25;
  }

  // ── Density multiplier: more leaks per word = exponentially worse ─────────
  const wordCount = rawText.trim() === '' ? 20 : rawText.trim().split(/\s+/).length;
  const leakDensity = leaks.length / Math.max(wordCount, 1);
  // Ranges from 1.0 (no leaks) to ~3.0 (very dense)
  const densityMultiplier = 1 + Math.min(leakDensity * 6, 2);

  // ── Combination penalty: each additional distinct category costs extra ─────
  const distinctCategories = new Set(leaks.map((l) => l.category)).size;
  // 1 category: 0 bonus penalty. 2: -5. 3: -15. 4+: -25
  const combinationPenalty = distinctCategories >= 4 ? 25 : distinctCategories === 3 ? 15 : distinctCategories === 2 ? 5 : 0;

  value -= Math.round(basePenalty * densityMultiplier) + combinationPenalty;
  value = Math.max(0, Math.min(100, value));

  const level: GhostScore['level'] =
    value >= 80 ? 'ghost' : value >= 50 ? 'warning' : 'exposed';

  return {
    value,
    level,
    leaks,
    timestamp: Date.now(),
  };
}
