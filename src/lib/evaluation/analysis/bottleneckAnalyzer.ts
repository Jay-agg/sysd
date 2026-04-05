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
    const ratio = n.config?._effectiveRatio ?? (n.currentLoad / n.capacity);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = n;
    }
  }

  if (!best || bestRatio <= 0) return insights;

  const sev = bestRatio > 1 ? 'high' : bestRatio > 0.85 ? 'medium' : 'low';

  let message = `${best.label} has the highest utilization (${(bestRatio * 100).toFixed(0)}% of capacity).`;
  
  if (best.config?._writeBottleneck) {
    message = `Write capacity exceeded on ${best.label}. Utilization: ${(bestRatio * 100).toFixed(0)}%`;
  } else if (best.config?._readBottleneck) {
    message = `Read capacity exceeded on ${best.label}. Utilization: ${(bestRatio * 100).toFixed(0)}%`;
  }

  insights.push({
    type: 'bottleneck',
    message,
    severity: sev,
    suggestion:
      bestRatio > 1
        ? 'Scale this tier horizontally, add shards/replicas, or add buffering upstream.'
        : 'Watch this component first if traffic grows.',
    nodeId: best.id,
  });

  return insights;
}

export function extractBottlenecks(nodes: SimNode[]): import('@/types/evaluation').PlaygroundBottleneck[] {
  const bottlenecks: import('@/types/evaluation').PlaygroundBottleneck[] = [];
  
  for (const n of nodes) {
    const ratio = n.config?._effectiveRatio ?? (n.capacity > 0 ? n.currentLoad / n.capacity : 0);
    if (ratio >= 1) {
      let type: 'write' | 'read' | 'compute' | 'network' | 'general' = 'compute';
      let message = `Capacity exceeded on ${n.label}`;

      if (n.config?._writeBottleneck) {
        type = 'write';
        message = `Write capacity exceeded`;
      } else if (n.config?._readBottleneck) {
        type = 'read';
        message = `Read capacity exceeded`;
      } 
      
      bottlenecks.push({
        type,
        node: n.type,
        message,
      });
    }
  }
  
  return bottlenecks;
}
