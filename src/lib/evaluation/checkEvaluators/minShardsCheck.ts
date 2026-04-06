import type { SimNode } from '@/types/simulation';
import type { CheckOutcome } from './types';

const DB_TYPES = new Set(['database', 'sqlDatabase', 'noSqlDatabase']);

export function evaluateMinShards(nodes: SimNode[], minShards: number): CheckOutcome {
  if (minShards <= 0) {
    return { ok: true, label: 'Min shards', detail: 'No minimum shard requirement.' };
  }

  const dbs = nodes.filter((n) => DB_TYPES.has(n.type));
  if (dbs.length === 0) {
    return {
      ok: false,
      label: 'Min shards',
      detail: `No database node found; need ≥${minShards} shards per database.`,
    };
  }

  const failing = dbs.filter((n) => (n.config?.shards ?? 1) < minShards);
  if (failing.length === 0) {
    return {
      ok: true,
      label: 'Min shards',
      detail: `All database nodes have ≥${minShards} shards.`,
    };
  }

  return {
    ok: false,
    label: 'Min shards',
    detail: `Each database needs ≥${minShards} shards; check: ${failing.map((n) => n.label).join(', ')}.`,
  };
}
