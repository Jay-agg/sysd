import { Scenario } from '@/types/simulation';

export const urlShortenerScenario: Scenario = {
  name: 'URL Shortener',
  description:
    'A simple URL shortener service: requests hit the API Gateway, pass through the App Server, and read/write to the Database.',
  nodes: [
    {
      id: 'api-gateway',
      label: 'API Gateway',
      type: 'apiGateway',
      capacity: 5000,
      baseLatency: 5,
      currentLoad: 0,
      latency: 5,
      errorRate: 0,
      status: 'healthy',
      position: { x: 100, y: 200 },
    },
    {
      id: 'app-server',
      label: 'App Server',
      type: 'appServer',
      capacity: 3000,
      baseLatency: 15,
      currentLoad: 0,
      latency: 15,
      errorRate: 0,
      status: 'healthy',
      position: { x: 450, y: 200 },
    },
    {
      id: 'database',
      label: 'Database',
      type: 'database',
      capacity: 1000,
      baseLatency: 30,
      currentLoad: 0,
      latency: 30,
      errorRate: 0,
      status: 'healthy',
      position: { x: 800, y: 200 },
    },
  ],
  edges: [
    { id: 'e-api-app', source: 'api-gateway', target: 'app-server' },
    { id: 'e-app-db', source: 'app-server', target: 'database' },
  ],
};
