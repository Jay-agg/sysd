import type { SimEdge, SimNode } from '@/types/simulation';
import type { SimulationSnapshot } from '@/types/evaluation';

/**
 * Build a deterministic snapshot from post-tick nodes and graph metadata.
 */
export function buildSimulationSnapshot(
  nodes: SimNode[],
  edges: SimEdge[],
  traffic: number
): SimulationSnapshot {
  const perNode: SimulationSnapshot['perNode'] = {};

  for (const n of nodes) {
    const cap = Math.max(n.capacity, 1e-9);
    perNode[n.id] = {
      load: n.currentLoad,
      latency: n.latency,
      errorRate: n.errorRate,
      utilization: n.currentLoad / cap,
    };
  }

  const count = nodes.length;
  const sumLatency = nodes.reduce((s, n) => s + n.latency, 0);
  const sumErr = nodes.reduce((s, n) => s + n.errorRate, 0);
  const maxLatencyMs = count ? Math.max(...nodes.map((n) => n.latency)) : 0;
  const maxError = count ? Math.max(...nodes.map((n) => n.errorRate)) : 0;

  const maxErrorPercent = maxError * 100;
  const avgLatencyMs = count ? Math.round(sumLatency / count) : 0;
  const avgErrorPercent = count ? (sumErr / count) * 100 : 0;

  const estimatedThroughput = traffic * (1 - maxError);

  return {
    nodes,
    edges,
    traffic,
    perNode,
    system: {
      maxLatencyMs,
      avgLatencyMs,
      sumLatencyMs: sumLatency,
      maxErrorRatePercent: maxErrorPercent,
      avgErrorRatePercent: avgErrorPercent,
      estimatedThroughput,
    },
  };
}
