import type { Challenge, TestCase } from '@/types/challenge';
import type { NormalizedTestChecks } from './checkEvaluators/normalizeChecks';
import { normalizeTestChecks } from './checkEvaluators/normalizeChecks';

/**
 * Merges per-test checks with challenge-level defaults from datav2 (scalingExpectations, requiredCapabilities).
 */
export function resolveTestChecksForChallenge(test: TestCase, challenge: Challenge): NormalizedTestChecks {
  const base = normalizeTestChecks(test.checks);
  const scale = challenge.scalingExpectations;

  const chCaps = challenge.requiredCapabilities ?? [];
  const testCaps = base.requiredCapabilities ?? [];
  const mergedCaps = [...new Set([...chCaps, ...testCaps])];

  const chMinR = scale?.minReplicas ?? 0;
  const chMinS = scale?.minShards ?? 0;

  return {
    ...base,
    minReplicas: Math.max(base.minReplicas ?? 0, chMinR),
    minShards: Math.max(base.minShards ?? 0, chMinS),
    requiredCapabilities: mergedCaps,
  };
}
