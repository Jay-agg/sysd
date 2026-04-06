import type { SimEdge, SimNode } from '@/types/simulation';
import type { TestChecks } from '@/types/challenge';
import type { CheckOutcome } from './types';
import { detectPatterns } from '../graph/patternDetector';

const CAPABILITY_TO_FLAG: Record<string, keyof ReturnType<typeof detectPatterns>> = {
  caching: 'caching',
  load_balancing: 'load_balancing',
  horizontal_scaling: 'horizontal_scaling',
  async_processing: 'async_processing',
};

export function evaluateRequiredCapabilities(
  nodes: SimNode[],
  edges: SimEdge[],
  required: NonNullable<TestChecks['requiredCapabilities']>
): CheckOutcome {
  if (!required.length) {
    return { ok: true, label: 'Capabilities', detail: 'No capability requirements.' };
  }

  const patterns = detectPatterns(nodes, edges);
  const missing: string[] = [];

  for (const cap of required) {
    const key = CAPABILITY_TO_FLAG[cap];
    if (!key) {
      missing.push(cap);
      continue;
    }
    if (!patterns[key]) {
      missing.push(cap.replace(/_/g, ' '));
    }
  }

  if (missing.length === 0) {
    return {
      ok: true,
      label: 'Capabilities',
      detail: `All ${required.length} required capability pattern(s) detected.`,
    };
  }

  return {
    ok: false,
    label: 'Capabilities',
    detail: `Missing patterns: ${missing.join(', ')}.`,
  };
}
