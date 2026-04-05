import type { SimEdge, SimNode } from '@/types/simulation';

/** Severity for playground insights (mapped to UI: critical/warning/info). */
export type PlaygroundInsightSeverity = 'high' | 'medium' | 'low';

export type PlaygroundInsightType =
  | 'bottleneck'
  | 'overload'
  | 'missing_component'
  | 'latency_chain'
  | 'reliability'
  | 'scalability';

export interface PlaygroundInsight {
  type: PlaygroundInsightType;
  message: string;
  severity: PlaygroundInsightSeverity;
  suggestion?: string;
  nodeId?: string;
}

/** Deterministic snapshot after one simulation tick at a given traffic level. */
export interface SimulationSnapshot {
  nodes: SimNode[];
  edges: SimEdge[];
  traffic: number;
  perNode: Record<
    string,
    {
      load: number;
      latency: number;
      errorRate: number;
      utilization: number;
    }
  >;
  system: {
    maxLatencyMs: number;
    avgLatencyMs: number;
    sumLatencyMs: number;
    maxErrorRatePercent: number;
    avgErrorRatePercent: number;
    /** Estimated delivered RPS after node-level drops (same model as challenge checks). */
    estimatedThroughput: number;
  };
}

export interface ChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface SingleTestEvaluation {
  testName: string;
  passed: boolean;
  summaryMessage: string;
  /** 0–100 for this test (0 if failed). */
  score: number;
  checklist: ChecklistItem[];
  traffic: number;
}

export interface ChallengeEvaluationResult {
  tests: SingleTestEvaluation[];
  overallPass: boolean;
  /** 0–100 weighted across evaluated tests. */
  overallScore: number;
}

export interface PlaygroundBottleneck {
  type: 'write' | 'read' | 'compute' | 'network' | 'general';
  node: string;
  message: string;
}

export interface PlaygroundEvaluationResult {
  insights: PlaygroundInsight[];
  bottlenecks?: PlaygroundBottleneck[];
  /** 0–100 scalability / architecture health. */
  score: number;
}
