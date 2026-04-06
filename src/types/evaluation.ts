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
  checklist: ChecklistItem[];
  traffic: number;
}

/** Five-dimensional score breakdown (0–100 each before weighting). */
export interface ScoreBreakdown {
  scalability: number;
  reliability: number;
  latency: number;
  architecture: number;
  efficiency: number;
}

export interface ExplainabilityOutput {
  score: number;
  breakdown: ScoreBreakdown;
  penalties: string[];
  highlights: string[];
}

export type GraphInsightSeverity = 'high' | 'medium' | 'low';

/** Deterministic graph / rule insights for the submission panel. */
export interface GraphInsightItem {
  type: 'anti-pattern' | 'pattern' | 'info';
  message: string;
  severity: GraphInsightSeverity;
}

export interface AiSuggestion {
  title: string;
  explanation: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ChallengeEvaluationResult {
  tests: SingleTestEvaluation[];
  overallPass: boolean;
  /** Final weighted score; meaningful only when overallPass and mode is submit. */
  overallScore: number;
  /** Populated only when all tests pass on submit. */
  explainability: ExplainabilityOutput | null;
  graphInsights: GraphInsightItem[];
  /** Snapshot at peak test traffic (for scoring / AI payload). */
  peakTraffic: number;
}

export interface RunTestResult {
  testName: string;
  passed: boolean;
  reason: string;
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
