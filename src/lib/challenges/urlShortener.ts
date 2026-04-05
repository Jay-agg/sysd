// @ts-nocheck — draft challenge shape; not used by questions.json yet.
import type { Challenge } from '@/types/challenge';

export const urlShortenerChallenge: Challenge = {
  id: 'url-shortener',
  title: 'Design a URL Shortener',
  difficulty: 'easy',
  tags: ['caching', 'database', 'api-design'],
  description: `Design a scalable URL shortening service (like bit.ly).

The system should handle:
- Accepting a long URL and returning a shortened version
- Redirecting users from the short URL to the original
- Handling up to 10,000 requests per second at peak

Think about the full request lifecycle: from client request, through your API layer, to data storage and back.`,
  requirements: [
    'Must include at least one API Gateway or Load Balancer as entry point',
    'Must include an App Server for business logic',
    'Must include a Database for persistent URL storage',
    'Add a Cache layer to handle read-heavy traffic efficiently',
    'All components must be connected (no orphan nodes)',
  ],
  constraints: [
    'Must handle 10,000 req/s peak traffic',
    'Read-to-write ratio is 100:1',
    'URL redirects should complete in < 50ms',
    'System must not have single points of failure for data',
  ],
  visibleTests: [
    {
      id: 'vt-1',
      name: 'Has Entry Point',
      description: 'System must have an API Gateway or Load Balancer',
      evaluate: (ctx) => {
        const hasEntry = ctx.nodeTypes.has('apiGateway') || ctx.nodeTypes.has('loadBalancer');
        return {
          passed: hasEntry,
          message: hasEntry
            ? 'Entry point found (API Gateway or Load Balancer)'
            : 'Missing entry point — add an API Gateway or Load Balancer',
        };
      },
    },
    {
      id: 'vt-2',
      name: 'Has App Server',
      description: 'System must have at least one App Server',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('appServer');
        return {
          passed: has,
          message: has ? 'App Server found' : 'Missing App Server for business logic',
        };
      },
    },
    {
      id: 'vt-3',
      name: 'Has Database',
      description: 'System must include a database for URL storage',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('database') || ctx.nodeTypes.has('sqlDatabase') || ctx.nodeTypes.has('noSqlDatabase');
        return {
          passed: has,
          message: has ? 'Database found' : 'Missing database for persistent storage',
        };
      },
    },
  ],
  hiddenTests: [
    {
      id: 'ht-1',
      name: 'Has Cache Layer',
      description: 'Cache required for read-heavy workload optimization',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('cache');
        return {
          passed: has,
          message: has
            ? 'Cache layer present for read optimization'
            : 'No cache layer — 100:1 read ratio needs caching',
        };
      },
    },
    {
      id: 'ht-2',
      name: 'Components Connected',
      description: 'All nodes must have at least one connection',
      evaluate: (ctx) => {
        const connectedIds = new Set<string>();
        ctx.edges.forEach((e) => {
          connectedIds.add(e.source);
          connectedIds.add(e.target);
        });
        const orphans = ctx.nodes.filter((n) => !connectedIds.has(n.id));
        const allConnected = orphans.length === 0;
        return {
          passed: allConnected,
          message: allConnected
            ? 'All components are connected'
            : `${orphans.length} orphan node(s): ${orphans.map((n) => n.label).join(', ')}`,
        };
      },
    },
    {
      id: 'ht-3',
      name: 'Minimum Component Count',
      description: 'At least 4 components required for a complete system',
      evaluate: (ctx) => {
        const enough = ctx.nodeCount >= 4;
        return {
          passed: enough,
          message: enough
            ? `${ctx.nodeCount} components used`
            : `Only ${ctx.nodeCount} components — need at least 4 for a complete design`,
        };
      },
    },
  ],
};
