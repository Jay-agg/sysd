import type { SimulationSnapshot } from '@/types/evaluation';
import type { TestChecks } from '@/types/challenge';
import type { CheckOutcome } from './types';

/**
 * Uses estimated system throughput (traffic × (1 − max node error rate)).
 * Matches the historical challenge evaluator behavior.
 */
export function evaluateMinThroughput(
  snapshot: SimulationSnapshot,
  minThroughput: TestChecks['minThroughput']
): CheckOutcome {
  const actual = snapshot.system.estimatedThroughput;
  if (actual >= minThroughput) {
    return {
      ok: true,
      label: 'Min throughput',
      detail: `Estimated throughput ${actual.toFixed(0)} rps ≥ ${minThroughput} rps.`,
    };
  }
  return {
    ok: false,
    label: 'Min throughput',
    detail: `Estimated throughput ${actual.toFixed(0)} rps is below ${minThroughput} rps.`,
  };
}
