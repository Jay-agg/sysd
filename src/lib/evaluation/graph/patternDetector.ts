import type { SimEdge, SimNode, SimNodeType } from '@/types/simulation';

const DB_TYPES: SimNodeType[] = ['database', 'sqlDatabase', 'noSqlDatabase'];
const BROKER_TYPES: SimNodeType[] = ['messageBroker', 'queue'];
const API_TYPES: SimNodeType[] = ['apiGateway'];

function isDb(t: SimNodeType): boolean {
  return DB_TYPES.includes(t);
}

function buildAdjacency(edges: SimEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) {
    const list = m.get(e.source) || [];
    list.push(e.target);
    m.set(e.source, list);
  }
  return m;
}

function reachableFrom(startIds: string[], outgoing: Map<string, string[]>, targetSet: Set<string>): boolean {
  const q = [...startIds];
  const seen = new Set<string>();
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (targetSet.has(id)) return true;
    const next = outgoing.get(id);
    if (next) for (const t of next) q.push(t);
  }
  return false;
}

/**
 * Detects architecture patterns used for scoring and capability checks.
 */
export function detectPatterns(nodes: SimNode[], edges: SimEdge[]) {
  const types = new Set(nodes.map((n) => n.type));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const hasCache = types.has('cache');
  const hasLb = types.has('loadBalancer');
  const appServers = nodes.filter((n) => n.type === 'appServer');
  const hasMultipleAppServers = appServers.length >= 2;

  const brokerIds = new Set(nodes.filter((n) => BROKER_TYPES.includes(n.type)).map((n) => n.id));
  const outgoing = buildAdjacency(edges);

  const apiIds = nodes.filter((n) => API_TYPES.includes(n.type)).map((n) => n.id);

  let directApiToDb = false;
  for (const e of edges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (s && t && API_TYPES.includes(s.type) && isDb(t.type)) {
      directApiToDb = true;
      break;
    }
  }

  const brokerHasDownstream = [...brokerIds].some((bid) => (outgoing.get(bid) || []).length > 0);
  const asyncProcessing =
    apiIds.length > 0 &&
    brokerIds.size > 0 &&
    brokerHasDownstream &&
    reachableFrom(apiIds, outgoing, brokerIds);

  const loadBalancing = hasLb || hasMultipleAppServers;

  const horizontalScaling = hasMultipleAppServers || appServers.some((n) => (n.config?.replicas ?? 1) > 1);

  return {
    caching: hasCache,
    load_balancing: loadBalancing,
    horizontal_scaling: horizontalScaling,
    async_processing: Boolean(asyncProcessing),
    direct_api_to_db: directApiToDb,
    has_load_balancer: hasLb,
  };
}
