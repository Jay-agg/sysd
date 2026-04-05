import type { SimNode, SimNodeType } from '@/types/simulation';
import type { CheckOutcome } from './types';

/**
 * Tier types that must not appear as a single instance when redundancy is required.
 * Excludes clients/CDN from redundancy rules.
 */
/**
 * Tiers where a single instance is treated as a SPOF for HA-style checks.
 * Cache/queue/broker are often modeled as one logical unit (clustering implied).
 */
const REDUNDANCY_TYPES: SimNodeType[] = [
  'loadBalancer',
  'appServer',
  'apiGateway',
  'worker',
  'database',
  'sqlDatabase',
  'noSqlDatabase',
];

function countByType(nodes: SimNode[], type: SimNodeType): number {
  return nodes.filter((n) => n.type === type).length;
}

export function detectSingleInstanceSpofs(nodes: SimNode[]): string[] {
  const reasons: string[] = [];

  for (const t of REDUNDANCY_TYPES) {
    const ofType = nodes.filter((n) => n.type === t);
    if (ofType.length === 1) {
      const node = ofType[0];
      if (['database', 'sqlDatabase', 'noSqlDatabase'].includes(t)) {
        const replicas = node.config?.replicas ?? 1;
        if (replicas < 2) {
          reasons.push(`${node.label} has only one replica (Single Point of Failure)`);
        }
      } else {
        reasons.push(`${t} has only one instance`);
      }
    }
  }

  return reasons;
}

export function evaluateNoSinglePointOfFailure(
  nodes: SimNode[],
  required: boolean
): CheckOutcome {
  if (!required) {
    return {
      ok: true,
      label: 'Redundancy (SPOF)',
      detail: 'SPOF check not required for this test.',
    };
  }

  const reasons = detectSingleInstanceSpofs(nodes);
  if (reasons.length === 0) {
    return {
      ok: true,
      label: 'Redundancy (SPOF)',
      detail: 'No single-instance redundancy issues on critical tiers.',
    };
  }

  return {
    ok: false,
    label: 'Redundancy (SPOF)',
    detail: reasons.join('; ') + '.',
  };
}
