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

export function calculateGhostScore(
  currentEmbedding: number[],
  baseProfile: number[] | null,
  leaks: LeakEntity[]
): GhostScore {
  let value = 100;

  // Penalización por similitud con el perfil base
  if (baseProfile && currentEmbedding.length > 0) {
    const similarity = cosineSimilarity(currentEmbedding, baseProfile);
    // Alta similitud = baja privacidad. Penalizar proporcionalmente.
    value -= Math.round(similarity * 50);
  }

  // Penalización por entidades detectadas
  for (const leak of leaks) {
    const penalty = { low: 2, medium: 8, high: 15, critical: 25 }[leak.risk];
    value -= penalty;
  }

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
