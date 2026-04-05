import type { SimulationSnapshot } from '@/types/evaluation';
import type { TestChecks } from '@/types/challenge';
import type { CheckOutcome } from './types';

export function evaluateMaxErrorRate(
  snapshot: SimulationSnapshot,
  maxErrorRatePercent: TestChecks['maxErrorRate']
): CheckOutcome {
  const actual = snapshot.system.maxErrorRatePercent;
  if (actual <= maxErrorRatePercent) {
    return {
      ok: true,
      label: 'Max error rate',
      detail: `Peak error rate ${actual.toFixed(2)}% ≤ ${maxErrorRatePercent}%.`,
    };
  }
  return {
    ok: false,
    label: 'Max error rate',
    detail: `Peak error rate ${actual.toFixed(2)}% exceeds ${maxErrorRatePercent}%.`,
  };
}
