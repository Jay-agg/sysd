import type { SimNode } from '@/types/simulation';
import type { PlaygroundInsight } from '@/types/evaluation';

/**
 * Highest load/capacity utilization among compute/data nodes (excludes clients).
 */
export function analyzeBottlenecks(nodes: SimNode[]): PlaygroundInsight[] {
  const insights: PlaygroundInsight[] = [];
  const candidates = nodes.filter(
    (n) =>
      n.type !== 'webClient' &&
      n.type !== 'mobileClient' &&
      n.capacity > 0
  );

  if (candidates.length === 0) return insights;

  let best: SimNode | null = null;
  let bestRatio = -1;

  for (const n of candidates) {
    const ratio = n.currentLoad / n.capacity;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = n;
    }
  }

  if (!best || bestRatio <= 0) return insights;

  const sev = bestRatio > 1 ? 'high' : bestRatio > 0.85 ? 'medium' : 'low';

  insights.push({
    type: 'bottleneck',
    message: `${best.label} has the highest utilization (${(bestRatio * 100).toFixed(0)}% of capacity).`,
    severity: sev,
    suggestion:
      bestRatio > 1
        ? 'Scale this tier horizontally or add buffering upstream.'
        : 'Watch this component first if traffic grows.',
    nodeId: best.id,
  });

  return insights;
}
