import type { SimulationSnapshot } from '@/types/evaluation';
import type { TestChecks } from '@/types/challenge';
import type { CheckOutcome } from './types';

export function evaluateMaxLatency(
  snapshot: SimulationSnapshot,
  maxLatencyMs: TestChecks['maxLatency']
): CheckOutcome {
  const actual = snapshot.system.maxLatencyMs;
  if (actual <= maxLatencyMs) {
    return {
      ok: true,
      label: 'Max latency',
      detail: `Peak node latency ${actual}ms ≤ ${maxLatencyMs}ms.`,
    };
  }
  return {
    ok: false,
    label: 'Max latency',
    detail: `Peak node latency ${actual}ms exceeds ${maxLatencyMs}ms.`,
  };
}
