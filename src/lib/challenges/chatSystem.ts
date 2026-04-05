// @ts-nocheck — draft challenge shape; not used by questions.json yet.
import type { Challenge } from '@/types/challenge';

export const chatSystemChallenge: Challenge = {
  id: 'chat-system',
  title: 'Design a Real-Time Chat System',
  difficulty: 'hard',
  tags: ['websockets', 'message-broker', 'scaling', 'database'],
  description: `Design a real-time chat system that supports group conversations with thousands of concurrent users.

The system should:
- Deliver messages in real-time using persistent connections
- Support group chats with many participants
- Persist all messages for offline access
- Handle 50,000 concurrent connected users`,
  requirements: [
    'Must include a Load Balancer for WebSocket distribution',
    'Must include a Message Broker for real-time message fan-out',
    'Must include a Database for message persistence',
    'Must include a Cache for recent messages and session data',
    'Must include multiple App Servers',
  ],
  constraints: [
    'Message delivery latency < 100ms',
    'Must handle 50,000 concurrent connections',
    'Messages must be persisted and retrievable',
  ],
  visibleTests: [
    {
      id: 'vt-1',
      name: 'Has Message Broker',
      description: 'Real-time fan-out requires a message broker',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('messageBroker') || ctx.nodeTypes.has('queue');
        return { passed: has, message: has ? 'Message broker found' : 'Missing message broker for real-time delivery' };
      },
    },
    {
      id: 'vt-2',
      name: 'Has Database',
      description: 'Messages must be persisted',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('database') || ctx.nodeTypes.has('sqlDatabase') || ctx.nodeTypes.has('noSqlDatabase');
        return { passed: has, message: has ? 'Database found' : 'Missing database for message storage' };
      },
    },
  ],
  hiddenTests: [
    {
      id: 'ht-1',
      name: 'Has Load Balancer',
      description: 'WebSocket connections need load balancing',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('loadBalancer');
        return { passed: has, message: has ? 'Load Balancer present' : 'Missing Load Balancer' };
      },
    },
    {
      id: 'ht-2',
      name: 'Has Cache',
      description: 'Cache needed for session data and recent messages',
      evaluate: (ctx) => {
        const has = ctx.nodeTypes.has('cache');
        return { passed: has, message: has ? 'Cache layer present' : 'Missing cache for sessions/recent messages' };
      },
    },
    {
      id: 'ht-3',
      name: 'Sufficient Components',
      description: 'Complex system needs at least 5 components',
      evaluate: (ctx) => {
        const enough = ctx.nodeCount >= 5;
        return { passed: enough, message: enough ? `${ctx.nodeCount} components` : `Only ${ctx.nodeCount} — need at least 5` };
      },
    },
  ],
};
