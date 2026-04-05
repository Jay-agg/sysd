import { SimNode, SimEdge, NodeStatus, Insight } from '@/types/simulation';

/**
 * Compute status from load/capacity ratio.
 */
function computeStatus(load: number, capacity: number): NodeStatus {
  const ratio = load / capacity;
  if (ratio <= 1) return 'healthy';
  if (ratio <= 1.5) return 'stressed';
  return 'overloaded';
}

/**
 * Compute latency based on load vs capacity.
 * - Under capacity: base latency
 * - Over capacity: latency grows quadratically
 */
function computeLatency(baseLatency: number, load: number, capacity: number): number {
  if (load <= capacity) return baseLatency;
  const overloadRatio = load / capacity;
  return Math.round(baseLatency * overloadRatio * overloadRatio);
}

/**
 * Compute error rate from load vs capacity.
 * - Under capacity: 0%
 * - Stressed: up to 10%
 * - Overloaded: scales up to ~80%
 */
function computeErrorRate(load: number, capacity: number): number {
  if (load <= capacity) return 0;
  const overloadRatio = load / capacity;
  if (overloadRatio <= 1.5) {
    // 0% at ratio=1, 10% at ratio=1.5
    return (overloadRatio - 1) * 0.2;
  }
  // 10% at 1.5x, maxes at ~80%
  return Math.min(0.1 + (overloadRatio - 1.5) * 0.25, 0.8);
}

/**
 * Run a single simulation tick.
 * Traffic enters the first node(s) with no incoming edges, then propagates.
 */
export function simulateTick(
  nodes: SimNode[],
  edges: SimEdge[],
  trafficLevel: number
): SimNode[] {
  const nodeMap = new Map<string, SimNode>();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  // Build adjacency: sourceId → targetIds
  const outgoing = new Map<string, string[]>();
  const hasIncoming = new Set<string>();

  edges.forEach((e) => {
    const list = outgoing.get(e.source) || [];
    list.push(e.target);
    outgoing.set(e.source, list);
    hasIncoming.add(e.target);
  });

  // Entry nodes = those with no incoming edges
  const entryNodes = nodes.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id);

  // BFS propagation
  const visited = new Set<string>();
  const queue = [...entryNodes];

  // Set initial load on entry nodes
  for (const id of entryNodes) {
    const node = nodeMap.get(id)!;
    node.currentLoad = trafficLevel;
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = nodeMap.get(currentId)!;
    const load = node.currentLoad;

    node.status = computeStatus(load, node.capacity);
    node.latency = computeLatency(node.baseLatency, load, node.capacity);
    node.errorRate = computeErrorRate(load, node.capacity);

    // Propagate: downstream receives (load minus dropped requests)
    const successfulRequests = load * (1 - node.errorRate);
    const targets = outgoing.get(currentId) || [];
    for (const targetId of targets) {
      const target = nodeMap.get(targetId)!;
      target.currentLoad = Math.round(successfulRequests);
      queue.push(targetId);
    }
  }

  return Array.from(nodeMap.values());
}

/**
 * Generate rule-based insights from current node states.
 */
export function generateInsights(nodes: SimNode[]): Insight[] {
  const insights: Insight[] = [];
  const hasCache = nodes.some((n) => n.type === 'cache');

  for (const node of nodes) {
    if (node.status === 'overloaded') {
      insights.push({
        id: `overloaded-${node.id}`,
        message: `${node.label} is overloaded (${node.currentLoad}/${node.capacity} req/s). Error rate: ${Math.round(node.errorRate * 100)}%.`,
        severity: 'critical',
        nodeId: node.id,
      });
    } else if (node.status === 'stressed') {
      insights.push({
        id: `stressed-${node.id}`,
        message: `${node.label} is under stress (${node.currentLoad}/${node.capacity} req/s). Latency rising.`,
        severity: 'warning',
        nodeId: node.id,
      });
    }
  }

  // DB-specific insights
  const db = nodes.find((n) => n.type === 'database');
  if (db && db.status === 'overloaded' && !hasCache) {
    insights.push({
      id: 'suggest-cache',
      message: 'Database is the bottleneck. Consider adding a cache layer to reduce DB load.',
      severity: 'critical',
    });
  }

  if (db && db.status === 'stressed' && !hasCache) {
    insights.push({
      id: 'suggest-cache-early',
      message: 'Database is under pressure. A cache would help absorb read traffic.',
      severity: 'warning',
    });
  }

  // Single point of failure
  const serverNodes = nodes.filter(
    (n) => n.type === 'appServer' || n.type === 'apiGateway'
  );
  const uniqueTypes = new Set(serverNodes.map((n) => n.type));
  for (const type of uniqueTypes) {
    const ofType = serverNodes.filter((n) => n.type === type);
    if (ofType.length === 1) {
      insights.push({
        id: `spof-${type}`,
        message: `Single point of failure: only one ${ofType[0].label}. Consider adding redundancy.`,
        severity: 'info',
      });
    }
  }

  return insights;
}
