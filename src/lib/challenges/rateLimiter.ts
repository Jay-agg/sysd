// @ts-nocheck — draft challenge shape; not used by questions.json yet.
import type { Challenge } from '@/types/challenge';

export const rateLimiterChallenge: Challenge = {
  id: 'rate-limiter',
  title: 'Design a Rate Limiter',
  difficulty: 'medium',
  tags: ['api-gateway', 'caching', 'distributed-systems'],
  description: `Design a distributed rate limiting system that can throttle API requests across multiple servers.

The system should:
- Track request counts per user/IP  
- Enforce rate limits consistently across distributed servers
- Handle burst traffic gracefully
- Return appropriate error responses (429) when limits are exceeded`,
  requirements: [
    'Must include a Load Balancer for traffic distribution',
    'Must include multiple App Servers (at least 2)',
    'Must include a shared Cache for distributed rate counting',
    'Must include an API Gateway for request routing',
  ],
  constraints: [
    'Rate limiting must be consistent across all servers',
    'Must handle 20,000 req/s peak traffic',
    'Latency overhead must be < 10ms per request',
  ],
  visibleTests: [
    {
      id: 'vt-1',
      name: 'Has Load Balancer',
      description: 'System must have a load balancer',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('loadBalancer');
        return { passed: has, message: has ? 'Load Balancer found' : 'Missing Load Balancer' };
      },
    },
    {
      id: 'vt-2',
      name: 'Has Shared Cache',
      description: 'Distributed rate counting needs a shared cache (like Redis)',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('cache');
        return { passed: has, message: has ? 'Shared cache found' : 'Missing shared cache for rate counting' };
      },
    },
  ],
  hiddenTests: [
    {
      id: 'ht-1',
      name: 'Multiple App Servers',
      description: 'Distributed system needs multiple servers',
      evaluate: (ctx) => {
        const serverCount = ctx.nodes.filter((n) => n.type === 'appServer').length;
        const has = serverCount >= 2;
        return { passed: has, message: has ? `${serverCount} App Servers found` : 'Need at least 2 App Servers' };
      },
    },
    {
      id: 'ht-2',
      name: 'Has API Gateway',
      description: 'API Gateway for request routing',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('apiGateway');
        return { passed: has, message: has ? 'API Gateway present' : 'Missing API Gateway' };
      },
    },
  ],
};
