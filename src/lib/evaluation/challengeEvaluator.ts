import { simulateTick } from '@/components/simulation/SimulationEngine';
import type { TestCase } from '@/types/challenge';
import type {
  ChallengeEvaluationResult,
  ChecklistItem,
  SingleTestEvaluation,
} from '@/types/evaluation';
import type { SimEdge, SimNode } from '@/types/simulation';
import { buildSimulationSnapshot } from './snapshot';
import { scorePassedTest } from './scoring';
import {
  evaluateMaxErrorRate,
  evaluateMaxLatency,
  evaluateMinThroughput,
  evaluateNoSinglePointOfFailure,
  evaluateRequiredComponents,
} from './checkEvaluators';

function outcomeToChecklistItem(id: string, o: { ok: boolean; label: string; detail: string }): ChecklistItem {
  return { id, label: o.label, passed: o.ok, detail: o.detail };
}

function evaluateSingleTest(
  test: TestCase,
  nodes: SimNode[],
  edges: SimEdge[]
): SingleTestEvaluation {
  const checklist: ChecklistItem[] = [];

  if (nodes.length === 0) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: 'Architecture empty. Add components to the canvas.',
      score: 0,
      checklist: [
        {
          id: 'non-empty',
          label: 'Non-empty graph',
          passed: false,
          detail: 'Add at least one node.',
        },
      ],
      traffic: test.input.traffic,
    };
  }

  const comp = evaluateRequiredComponents(nodes, test.checks.requiredComponents);
  checklist.push(outcomeToChecklistItem('components', comp));
  if (!comp.ok) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: comp.detail,
      score: 0,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const spof = evaluateNoSinglePointOfFailure(nodes, test.checks.noSinglePointOfFailure);
  checklist.push(outcomeToChecklistItem('spof', spof));
  if (!spof.ok) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: spof.detail,
      score: 0,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const updatedNodes = simulateTick(nodes, edges, test.input.traffic);
  const snapshot = buildSimulationSnapshot(updatedNodes, edges, test.input.traffic);

  const lat = evaluateMaxLatency(snapshot, test.checks.maxLatency);
  const err = evaluateMaxErrorRate(snapshot, test.checks.maxErrorRate);
  const thr = evaluateMinThroughput(snapshot, test.checks.minThroughput);

  checklist.push(outcomeToChecklistItem('latency', lat));
  checklist.push(outcomeToChecklistItem('error', err));
  checklist.push(outcomeToChecklistItem('throughput', thr));

  const passed = lat.ok && err.ok && thr.ok;
  if (!passed) {
    const firstFail = [lat, err, thr].find((x) => !x.ok)!;
    return {
      testName: test.name,
      passed: false,
      summaryMessage: firstFail.detail,
      score: 0,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const score = scorePassedTest(snapshot, test.checks);
  const maxL = snapshot.system.maxLatencyMs;
  return {
    testName: test.name,
    passed: true,
    summaryMessage: `Handled ${test.input.traffic} RPS with ${maxL}ms peak latency.`,
    score,
    checklist,
    traffic: test.input.traffic,
  };
}

/**
 * Run the challenge evaluation pipeline on an explicit ordered list of tests.
 */
export function evaluateTestSuite(
  tests: TestCase[],
  nodes: SimNode[],
  edges: SimEdge[]
): ChallengeEvaluationResult {
  const results = tests.map((t) => evaluateSingleTest(t, nodes, edges));
  const overallPass = results.length > 0 && results.every((r) => r.passed);
  const overallScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

  return {
    tests: results,
    overallPass,
    overallScore,
  };
}
