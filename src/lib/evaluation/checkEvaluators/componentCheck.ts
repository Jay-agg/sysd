import type { ComponentType } from '@/types/component';
import type { SimNode, SimNodeType } from '@/types/simulation';
import type { TestChecks } from '@/types/challenge';
import type { CheckOutcome } from './types';

/** Maps canonical check tokens to canvas node types that satisfy the requirement. */
const COMPONENT_TO_SIM_TYPES: Record<ComponentType, SimNodeType[]> = {
  apiGateway: ['apiGateway'],
  appServer: ['appServer', 'apiGateway', 'worker'],
  database: ['database', 'sqlDatabase', 'noSqlDatabase'],
  cache: ['cache'],
  loadBalancer: ['loadBalancer'],
  webClient: ['webClient'],
  mobileClient: ['mobileClient'],
  worker: ['worker'],
  messageBroker: ['messageBroker', 'queue'],
  sqlDatabase: ['sqlDatabase'],
  noSqlDatabase: ['noSqlDatabase'],
  cdn: ['cdn'],
};

function tokenSatisfied(token: ComponentType, types: Set<SimNodeType>): boolean {
  const mapped = COMPONENT_TO_SIM_TYPES[token];
  return mapped.some((t) => types.has(t));
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
      missing.push(req.replace(/([A-Z])/g, ' $1').trim());
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
