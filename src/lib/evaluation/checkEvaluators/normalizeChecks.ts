import type { TestChecks, TestChecksInput } from '@/types/challenge';
import { normalizeRequiredComponents } from '@/lib/evaluation/componentNormalization';

export type NormalizedTestChecks = TestChecks & {
  minReplicas: number;
  minShards: number;
  requiredCapabilities: string[];
};

const PASSTHROUGH_LATENCY = 1_000_000;
const PASSTHROUGH_ERROR_PCT = 100;

/**
 * Fills omitted keys so partial bank tests (datav3) still run deterministically.
 * Missing latency/error/throughput limits → permissive defaults (no-op thresholds).
 */
export function normalizeTestChecks(checks: TestChecksInput): NormalizedTestChecks {
  return {
    maxLatency: checks.maxLatency ?? PASSTHROUGH_LATENCY,
    maxErrorRate: checks.maxErrorRate ?? PASSTHROUGH_ERROR_PCT,
    minThroughput: checks.minThroughput ?? 0,
    noSinglePointOfFailure: checks.noSinglePointOfFailure ?? false,
    requiredComponents: normalizeRequiredComponents(
      (checks.requiredComponents ?? []) as string[]
    ),
    minReplicas: checks.minReplicas ?? 0,
    minShards: checks.minShards ?? 0,
    requiredCapabilities: checks.requiredCapabilities ?? [],
  };
}
