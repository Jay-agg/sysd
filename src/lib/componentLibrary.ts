import type { ComponentDef } from '@/types/simulation';

export interface ComponentCategory {
  name: string;
  items: ComponentDef[];
}

export const componentLibrary: ComponentCategory[] = [
  {
    name: 'Most Used',
    items: [
      { type: 'apiGateway',   label: 'API Gateway',   defaultCapacity: 5000, defaultLatency: 5 },
      { type: 'loadBalancer', label: 'Load Balancer',  defaultCapacity: 8000, defaultLatency: 2 },
      { type: 'appServer',    label: 'App Server',     defaultCapacity: 3000, defaultLatency: 15 },
      { type: 'database',     label: 'Database',       defaultCapacity: 1000, defaultLatency: 30 },
      { type: 'cache',        label: 'Cache',          defaultCapacity: 10000, defaultLatency: 2 },
    ],
  },
  {
    name: 'Client',
    items: [
      { type: 'webClient',    label: 'Web Client',    defaultCapacity: 99999, defaultLatency: 0 },
      { type: 'mobileClient', label: 'Mobile Client', defaultCapacity: 99999, defaultLatency: 0 },
    ],
  },
  {
    name: 'Backend',
    items: [
      { type: 'appServer', label: 'API Server', defaultCapacity: 3000, defaultLatency: 15 },
      { type: 'worker',    label: 'Worker',     defaultCapacity: 2000, defaultLatency: 50 },
      { type: 'queue',     label: 'Queue',      defaultCapacity: 15000, defaultLatency: 5 },
    ],
  },
  {
    name: 'Data Layer',
    items: [
      { type: 'sqlDatabase',   label: 'SQL Database',   defaultCapacity: 1000, defaultLatency: 30 },
      { type: 'noSqlDatabase', label: 'NoSQL Database', defaultCapacity: 5000, defaultLatency: 10 },
      { type: 'cache',         label: 'Cache (Redis)',  defaultCapacity: 10000, defaultLatency: 2 },
    ],
  },
  {
    name: 'Infra',
    items: [
      { type: 'cdn',           label: 'CDN',            defaultCapacity: 50000, defaultLatency: 1 },
      { type: 'messageBroker', label: 'Message Broker', defaultCapacity: 20000, defaultLatency: 3 },
    ],
  },
];
