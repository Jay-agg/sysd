import type { SimNode } from '@/types/simulation';
import { detectSingleInstanceSpofs } from '../checkEvaluators/spofCheck';
import type { GraphInsightItem } from '@/types/evaluation';

/**
 * Graph-layer SPOF insights (structured, deterministic).
 */
export function spofDetector(nodes: SimNode[]): GraphInsightItem[] {
  const reasons = detectSingleInstanceSpofs(nodes);
  return reasons.map((message) => ({
    type: 'anti-pattern' as const,
    message,
    severity: 'high' as const,
  }));
}
