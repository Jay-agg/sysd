import type { SimulationSnapshot } from '@/types/evaluation';
import type { SimNode } from '@/types/simulation';
import type { GraphInsightItem } from '@/types/evaluation';

/**
 * Bottleneck analysis for submission insights (deterministic).
 */
export function bottleneckAnalyzer(nodes: SimNode[], snapshot: SimulationSnapshot): GraphInsightItem[] {
  const out: GraphInsightItem[] = [];

  for (const n of nodes) {
    if (n.type === 'webClient' || n.type === 'mobileClient' || n.type === 'cdn') continue;
    const cap = Math.max(n.capacity, 1e-9);
    const util = snapshot.perNode[n.id]?.utilization ?? n.currentLoad / cap;
    if (util > 1) {
      const sev: GraphInsightItem['severity'] = util > 1.2 ? 'high' : 'medium';
      let msg = `${n.label} is overloaded (utilization ${(util * 100).toFixed(0)}%).`;
      if (n.config?._writeBottleneck) {
        msg = `Database write path is saturated on ${n.label}.`;
      } else if (n.config?._readBottleneck) {
        msg = `Database read path is saturated on ${n.label}.`;
      }
      out.push({
        type: 'anti-pattern',
        message: msg,
        severity: sev,
      });
    }
  }

  return out;
}
