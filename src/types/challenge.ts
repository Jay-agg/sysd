import type { ChecklistItem } from '@/types/evaluation';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestChecks {
  maxLatency: number;
  maxErrorRate: number;
  minThroughput: number;
  noSinglePointOfFailure: boolean;
  requiredComponents: string[];
}

export interface TestCase {
  name: string;
  input: { traffic: number };
  checks: TestChecks;
}

export interface TestResult {
  passed: boolean;
  message: string;
  checklist?: ChecklistItem[];
  /** Per-test score (0–100) when evaluation engine computed it. */
  score?: number;
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
}
