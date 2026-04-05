export type NodeStatus = 'healthy' | 'stressed' | 'overloaded';

export type SimNodeType =
  | 'apiGateway'
  | 'appServer'
  | 'database'
  | 'cache'
  | 'loadBalancer'
  | 'webClient'
  | 'mobileClient'
  | 'worker'
  | 'queue'
  | 'sqlDatabase'
  | 'noSqlDatabase'
  | 'cdn'
  | 'messageBroker';

export interface SimNode {
  id: string;
  label: string;
  type: SimNodeType;
  capacity: number;
  baseLatency: number;
  currentLoad: number;
  latency: number;
  errorRate: number;
  status: NodeStatus;
  position: { x: number; y: number };
  config?: Record<string, any>;
}

export interface SimEdge {
  id: string;
  source: string;
  target: string;
}

export interface Scenario {
  name: string;
  description: string;
  nodes: SimNode[];
  edges: SimEdge[];
}

export interface Insight {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  nodeId?: string;
}

export interface SimMetrics {
  totalRequests: number;
  avgLatency: number;
  errorPercent: number;
}

export interface ComponentDef {
  type: SimNodeType;
  label: string;
  defaultCapacity: number;
  defaultLatency: number;
}
