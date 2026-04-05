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

    let effectiveRatio = load / node.capacity;
    const isDb = ['database', 'sqlDatabase', 'noSqlDatabase'].includes(node.type);

    if (isDb) {
      const replicas = node.config?.replicas ?? 1;
      const shards = node.config?.shards ?? 1;
      const effectiveWriteCapacity = node.capacity * shards;
      const effectiveReadCapacity = node.capacity * replicas * shards;

      // Assuming a default 100:1 read:write ratio typical for such systems if not specified
      const writeRatioParams = node.config?.writeRatio ?? 0.01;
      const readRatioParams = 1 - writeRatioParams;

      const writeLoad = load * writeRatioParams;
      const readLoad = load * readRatioParams;

      const writeOverload = writeLoad / effectiveWriteCapacity;
      const readOverload = readLoad / effectiveReadCapacity;

      effectiveRatio = Math.max(writeOverload, readOverload);

      node.config = {
        ...node.config,
        _writeBottleneck: writeOverload > 1 && writeOverload >= readOverload,
        _readBottleneck: readOverload > 1 && readOverload > writeOverload,
        _effectiveRatio: effectiveRatio,
      };
    }

    const simulatedLoad = effectiveRatio * node.capacity;
    node.status = computeStatus(simulatedLoad, node.capacity);
    node.latency = computeLatency(node.baseLatency, simulatedLoad, node.capacity);
    node.errorRate = computeErrorRate(simulatedLoad, node.capacity);

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
  const dbs = nodes.filter((n) => ['database', 'sqlDatabase', 'noSqlDatabase'].includes(n.type));
  
  for (const db of dbs) {
    if (db.status === 'overloaded' && !hasCache) {
      insights.push({
        id: `suggest-cache-${db.id}`,
        message: 'Database is the bottleneck. Consider adding a cache layer to reduce DB load.',
        severity: 'critical',
      });
    }

    if (db.status === 'stressed' && !hasCache) {
      insights.push({
        id: `suggest-cache-early-${db.id}`,
        message: 'Database is under pressure. A cache would help absorb read traffic.',
        severity: 'warning',
      });
    }

    if (db.status === 'overloaded' || db.status === 'stressed') {
      if (db.config?._writeBottleneck) {
        insights.push({
          id: `db-write-bottleneck-${db.id}`,
          message: `Write capacity exceeded on ${db.label}.`,
          severity: 'critical',
          nodeId: db.id,
        });

        const shards = db.config?.shards ?? 1;
        if (shards === 1) {
          insights.push({
            id: `db-suggest-sharding-${db.id}`,
            message: `${db.label} is write-heavy. Suggest adding shards to distribute writes.`,
            severity: 'warning',
            nodeId: db.id,
          });
        }
      } else if (db.config?._readBottleneck) {
        insights.push({
          id: `db-read-bottleneck-${db.id}`,
          message: `Read capacity exceeded on ${db.label}.`,
          severity: 'critical',
          nodeId: db.id,
        });

        const replicas = db.config?.replicas ?? 1;
        if (replicas === 1) {
          insights.push({
            id: `db-suggest-replicas-${db.id}`,
            message: `${db.label} is read-heavy. Suggest adding replicas to distribute reads.`,
            severity: 'warning',
            nodeId: db.id,
          });
        }
      }
    }
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
