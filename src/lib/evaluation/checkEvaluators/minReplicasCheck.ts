import type { SimNode } from '@/types/simulation';
import type { CheckOutcome } from './types';

const DB_TYPES = new Set(['database', 'sqlDatabase', 'noSqlDatabase']);

export function evaluateMinReplicas(nodes: SimNode[], minReplicas: number): CheckOutcome {
  if (minReplicas <= 0) {
    return { ok: true, label: 'Min replicas', detail: 'No minimum replica requirement.' };
  }

  const dbs = nodes.filter((n) => DB_TYPES.has(n.type));
  if (dbs.length === 0) {
    return {
      ok: false,
      label: 'Min replicas',
      detail: `No database node found; need ≥${minReplicas} replicas per database.`,
    };
  }

  const failing = dbs.filter((n) => (n.config?.replicas ?? 1) < minReplicas);
  if (failing.length === 0) {
    return {
      ok: true,
      label: 'Min replicas',
      detail: `All database nodes have ≥${minReplicas} replicas.`,
    };
  }

  return {
    ok: false,
    label: 'Min replicas',
    detail: `Each database needs ≥${minReplicas} replicas; check: ${failing.map((n) => n.label).join(', ')}.`,
  };
}
