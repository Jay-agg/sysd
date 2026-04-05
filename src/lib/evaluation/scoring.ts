import type { TestChecks } from '@/types/challenge';
import type { SimulationSnapshot } from '@/types/evaluation';

const W_LATENCY = 0.35;
const W_ERROR = 0.35;
const W_ARCH = 0.3;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function latencyHeadroomScore(actualMs: number, maxMs: number): number {
  if (maxMs <= 0) return 100;
  return clamp(Math.round((100 * (maxMs - actualMs)) / maxMs), 0, 100);
}

function errorHeadroomScore(actualPercent: number, maxPercent: number): number {
  if (maxPercent <= 0) return actualPercent <= 0 ? 100 : 0;
  return clamp(Math.round((100 * (maxPercent - actualPercent)) / maxPercent), 0, 100);
}

/**
 * Weighted score for a **passed** test using headroom under declared limits.
 * Architecture bucket is 100 when structural checks already passed.
 */
export function scorePassedTest(snapshot: SimulationSnapshot, checks: TestChecks): number {
  const L = latencyHeadroomScore(snapshot.system.maxLatencyMs, checks.maxLatency);
  const E = errorHeadroomScore(snapshot.system.maxErrorRatePercent, checks.maxErrorRate);
  const A = 100;
  return Math.round(W_LATENCY * L + W_ERROR * E + W_ARCH * A);
}
