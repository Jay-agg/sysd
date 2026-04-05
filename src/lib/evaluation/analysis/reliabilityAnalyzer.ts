import type { SimNode } from '@/types/simulation';
import type { PlaygroundInsight } from '@/types/evaluation';
import { detectSingleInstanceSpofs } from '../checkEvaluators/spofCheck';

export function analyzeReliability(nodes: SimNode[]): PlaygroundInsight[] {
  const insights: PlaygroundInsight[] = [];
  const reasons = detectSingleInstanceSpofs(nodes);

  for (const r of reasons) {
    insights.push({
      type: 'reliability',
      message: `Reliability risk: ${r}.`,
      severity: 'medium',
      suggestion: 'Add redundant instances behind load balancing or partitioning.',
    });
  }

  return insights;
}
