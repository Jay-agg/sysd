import type { SimEdge, SimNode } from '@/types/simulation';
import type { PlaygroundInsight } from '@/types/evaluation';

function buildOutgoing(edges: SimEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) {
    const list = m.get(e.source) || [];
    list.push(e.target);
    m.set(e.source, list);
  }
  return m;
}

function entryNodeIds(nodes: SimNode[], edges: SimEdge[]): string[] {
  const incoming = new Set(edges.map((e) => e.target));
  return nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id);
}

/**
 * Approximates slowest request path as max sum of per-node latency along any path from an entry node.
 * Works for small DAGs; stops on revisiting nodes in a path to avoid infinite loops.
 */
export function analyzeLatencyChains(nodes: SimNode[], edges: SimEdge[]): PlaygroundInsight[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = buildOutgoing(edges);
  const entries = entryNodeIds(nodes, edges);
  const insights: PlaygroundInsight[] = [];

  if (entries.length === 0 || nodes.length === 0) return insights;

  let bestSum = -1;
  let bestPath: string[] = [];

  function dfs(nodeId: string, sum: number, path: string[], stack: Set<string>): void {
    if (stack.has(nodeId)) return;
    const node = nodeMap.get(nodeId);
    if (!node) return;

    stack.add(nodeId);
    const nextSum = sum + node.latency;
    const nextPath = [...path, nodeId];
    const outs = outgoing.get(nodeId) || [];

    if (outs.length === 0) {
      if (nextSum > bestSum) {
        bestSum = nextSum;
        bestPath = nextPath;
      }
    } else {
      for (const t of outs) {
        dfs(t, nextSum, nextPath, stack);
      }
    }
    stack.delete(nodeId);
  }

  for (const e of entries) {
    dfs(e, 0, [], new Set());
  }

  if (bestSum <= 0 || bestPath.length === 0) return insights;

  const slowest = bestPath.map((id) => nodeMap.get(id)!.label).join(' → ');

  insights.push({
    type: 'latency_chain',
    message: `Slowest path (sum of node latencies ≈ ${bestSum}ms): ${slowest}.`,
    severity: bestSum > 500 ? 'high' : bestSum > 200 ? 'medium' : 'low',
    suggestion: 'Reduce hops, cache reads, or parallelize independent work.',
  });

  return insights;
}
