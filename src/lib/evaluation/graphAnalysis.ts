import type { SimulationSnapshot } from '@/types/evaluation';
import type { GraphInsightItem } from '@/types/evaluation';
import type { SimEdge, SimNode } from '@/types/simulation';
import { bottleneckAnalyzer } from './graph/bottleneckGraph';
import { patternInsights } from './graph/patternInsights';
import { detectPatterns } from './graph/patternDetector';
import { spofDetector } from './graph/spofGraph';

function dedupe(items: GraphInsightItem[]): GraphInsightItem[] {
  const seen = new Set<string>();
  const out: GraphInsightItem[] = [];
  for (const x of items) {
    const k = `${x.type}:${x.message}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

/**
 * Combined deterministic graph analysis for submission insights.
 */
export function runGraphAnalysis(
  nodes: SimNode[],
  edges: SimEdge[],
  snapshot: SimulationSnapshot,
  peakTraffic: number
): GraphInsightItem[] {
  const p = detectPatterns(nodes, edges);
  const items: GraphInsightItem[] = [
    ...spofDetector(nodes),
    ...bottleneckAnalyzer(nodes, snapshot),
    ...patternInsights(nodes, edges),
  ];

  if (p.direct_api_to_db) {
    items.push({
      type: 'anti-pattern',
      message: 'API connects directly to the database, skipping the application tier.',
      severity: 'high',
    });
  }
  if (peakTraffic > 1000 && !p.has_load_balancer) {
    items.push({
      type: 'anti-pattern',
      message: 'High traffic without a dedicated load balancer increases routing risk.',
      severity: 'medium',
    });
  }

  return dedupe(items);
}
