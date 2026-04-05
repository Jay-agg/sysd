import type { SimNode, SimNodeType } from '@/types/simulation';
import type { TestChecks } from '@/types/challenge';
import type { CheckOutcome } from './types';

/** Maps challenge JSON tokens to acceptable SimNode types. */
const REQUIRED_TOKEN_TO_TYPES: Record<string, SimNodeType[]> = {
  load_balancer: ['loadBalancer'],
  application_servers: ['appServer', 'apiGateway', 'worker'],
  database: ['database', 'sqlDatabase', 'noSqlDatabase'],
  cache: ['cache'],
  message_queue: ['queue', 'messageBroker'],
};

function tokenSatisfied(token: string, types: Set<SimNodeType>): boolean {
  const mapped = REQUIRED_TOKEN_TO_TYPES[token];
  if (mapped) {
    return mapped.some((t) => types.has(t));
  }
  return types.has(token as SimNodeType);
}

export function evaluateRequiredComponents(
  nodes: SimNode[],
  required: TestChecks['requiredComponents']
): CheckOutcome {
  if (required.length === 0) {
    return { ok: true, label: 'Required components', detail: 'No component requirements.' };
  }

  const types = new Set(nodes.map((n) => n.type));
  const missing: string[] = [];

  for (const req of required) {
    if (!tokenSatisfied(req, types)) {
      missing.push(req.replace(/_/g, ' '));
    }
  }

  if (missing.length === 0) {
    return {
      ok: true,
      label: 'Required components',
      detail: `All ${required.length} required component type(s) present.`,
    };
  }

  return {
    ok: false,
    label: 'Required components',
    detail: `Missing: ${missing.join(', ')}.`,
  };
}
