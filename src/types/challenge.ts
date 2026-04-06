import type { ComponentType } from '@/types/component';
import type { ChecklistItem } from '@/types/evaluation';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Weights for final score; sums to 1 in data. May include 3 dims (scalability, reliability, latency) or 5. */
export interface EvaluationCriteria {
  scalability?: number;
  reliability?: number;
  latency?: number;
  architecture?: number;
  efficiency?: number;
}

export interface ScalingExpectations {
  minReplicas: number;
  minShards: number;
}

export interface TestChecks {
  maxLatency: number;
  maxErrorRate: number;
  minThroughput: number;
  noSinglePointOfFailure: boolean;
  requiredComponents: ComponentType[];
  /** Minimum replicas on every database node (0 = skip check). */
  minReplicas?: number;
  /** Minimum shards on every database node (0 = skip check). */
  minShards?: number;
  /** Declarative capability tokens validated against graph patterns (see patternDetector). */
  requiredCapabilities?: string[];
}

/** Per-test checks from the bank; omitted keys use defaults in `normalizeTestChecks`. Raw JSON may use legacy component strings. */
export type TestChecksInput = Partial<Omit<TestChecks, 'requiredComponents'>> & {
  requiredComponents?: (string | ComponentType)[];
};

export interface TestCase {
  name: string;
  input: { traffic: number };
  checks: TestChecksInput;
}

export interface TestResult {
  passed: boolean;
  /** Short deterministic explanation (1–2 lines). */
  message: string;
  /** Full checklist only after Submit; omitted for Run Test (debug). */
  checklist?: ChecklistItem[];
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  tags: string[];
  requirements: string[];
  visibleTests: TestCase[];
  hiddenTests: TestCase[];
  /** From question bank: weights for scoring dimensions (3- or 5-dimensional). */
  evaluationCriteria?: EvaluationCriteria;
  expectedPatterns?: string[];
  antiPatterns?: string[];
  /** Merged into each test’s effective checks with per-test requirements. */
  requiredCapabilities?: string[];
  scalingExpectations?: ScalingExpectations;
  companyTags?: string[];
  idealSolutionCharacteristics?: string[];
}
