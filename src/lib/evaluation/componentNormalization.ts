import type { ComponentType } from '@/types/component';
import { SUPPORTED_COMPONENTS } from '@/types/component';

/** Legacy / alternate names from older datasets → canonical `ComponentType`. */
export const COMPONENT_MAP: Record<string, ComponentType> = {
  messageQueue: 'messageBroker',
  queue: 'messageBroker',
  message_queue: 'messageBroker',

  blobStorage: 'database',
  objectStorage: 'database',

  redis: 'cache',
  memcached: 'cache',

  applicationServer: 'appServer',
  application_servers: 'appServer',

  load_balancer: 'loadBalancer',
};

export function normalizeComponent(name: string): ComponentType | null {
  const trimmed = name.trim();
  if ((SUPPORTED_COMPONENTS as readonly string[]).includes(trimmed)) {
    return trimmed as ComponentType;
  }
  return COMPONENT_MAP[trimmed] ?? null;
}

/** Maps, drops unknowns, dedupes. */
export function normalizeRequiredComponents(names: string[]): ComponentType[] {
  const out: ComponentType[] = [];
  for (const n of names) {
    const c = normalizeComponent(n);
    if (c) out.push(c);
  }
  return [...new Set(out)];
}
