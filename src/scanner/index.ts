import type { ScanResult, PrivacyLevel } from '../types/index.js';
import { applyRules, calcRiskScore } from './rules.js';

/**
 * Scan `text` for privacy signals at the given `level`.
 *
 * All RegExp patterns are pre-compiled at module import time (see patterns.ts).
 * This function is synchronous and should complete in < 15ms for typical inputs.
 */
export function scan(text: string, level: PrivacyLevel): ScanResult {
  if (!text || text.trim().length === 0) {
    return { signals: [], riskScore: 0 };
  }

  const signals = applyRules(text, level);
  const riskScore = calcRiskScore(signals);

  return { signals, riskScore };
}
