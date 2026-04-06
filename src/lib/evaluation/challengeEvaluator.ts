import { simulateTick } from '@/components/simulation/SimulationEngine';
import type { Challenge, TestCase } from '@/types/challenge';
import type {
  ChallengeEvaluationResult,
  ChecklistItem,
  RunTestResult,
  SingleTestEvaluation,
} from '@/types/evaluation';
import type { SimEdge, SimNode } from '@/types/simulation';
import { buildSimulationSnapshot } from './snapshot';
import { computeEliteScore } from './eliteScoring';
import { runGraphAnalysis } from './graphAnalysis';
import {
  evaluateMaxErrorRate,
  evaluateMaxLatency,
  evaluateMinThroughput,
  evaluateNoSinglePointOfFailure,
  evaluateRequiredComponents,
  evaluateRequiredCapabilities,
  evaluateMinReplicas,
  evaluateMinShards,
} from './checkEvaluators';
import { resolveTestChecksForChallenge } from './resolveTestChecks';

function outcomeToChecklistItem(id: string, o: { ok: boolean; label: string; detail: string }): ChecklistItem {
  return { id, label: o.label, passed: o.ok, detail: o.detail };
}

function shortReason(detail: string): string {
  const line = detail.split('\n')[0]?.trim() ?? detail;
  return line.length > 160 ? `${line.slice(0, 157)}…` : line;
}

function evaluateSingleTest(
  test: TestCase,
  challenge: Challenge,
  nodes: SimNode[],
  edges: SimEdge[],
  options: { includeChecklist: boolean }
): SingleTestEvaluation {
  const checklist: ChecklistItem[] = [];
  const checks = resolveTestChecksForChallenge(test, challenge);

  if (nodes.length === 0) {
    const msg = 'Architecture empty. Add components to the canvas.';
    return {
      testName: test.name,
      passed: false,
      summaryMessage: msg,
      checklist: options.includeChecklist
        ? [{ id: 'non-empty', label: 'Non-empty graph', passed: false, detail: 'Add at least one node.' }]
        : [],
      traffic: test.input.traffic,
    };
  }

  const push = (id: string, o: { ok: boolean; label: string; detail: string }) => {
    if (options.includeChecklist) checklist.push(outcomeToChecklistItem(id, o));
  };

  const comp = evaluateRequiredComponents(nodes, checks.requiredComponents);
  push('components', comp);
  if (!comp.ok) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: comp.detail,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const caps = evaluateRequiredCapabilities(nodes, edges, checks.requiredCapabilities);
  push('capabilities', caps);
  if (!caps.ok) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: caps.detail,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const spof = evaluateNoSinglePointOfFailure(nodes, checks.noSinglePointOfFailure);
  push('spof', spof);
  if (!spof.ok) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: spof.detail,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const rep = evaluateMinReplicas(nodes, checks.minReplicas);
  push('minReplicas', rep);
  if (!rep.ok) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: rep.detail,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const sh = evaluateMinShards(nodes, checks.minShards);
  push('minShards', sh);
  if (!sh.ok) {
    return {
      testName: test.name,
      passed: false,
      summaryMessage: sh.detail,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const updatedNodes = simulateTick(nodes, edges, test.input.traffic);
  const snapshot = buildSimulationSnapshot(updatedNodes, edges, test.input.traffic);

  const lat = evaluateMaxLatency(snapshot, checks.maxLatency);
  const err = evaluateMaxErrorRate(snapshot, checks.maxErrorRate);
  const thr = evaluateMinThroughput(snapshot, checks.minThroughput);

  push('latency', lat);
  push('error', err);
  push('throughput', thr);

  const passed = lat.ok && err.ok && thr.ok;
  if (!passed) {
    const firstFail = [lat, err, thr].find((x) => !x.ok)!;
    return {
      testName: test.name,
      passed: false,
      summaryMessage: firstFail.detail,
      checklist,
      traffic: test.input.traffic,
    };
  }

  const maxL = snapshot.system.maxLatencyMs;
  return {
    testName: test.name,
    passed: true,
    summaryMessage: `Handled ${test.input.traffic} RPS with ${maxL}ms peak latency.`,
    checklist,
    traffic: test.input.traffic,
  };
}

/**
 * Run visible tests only — debug / Run Test. No scores, no checklist in results.
 */
export function evaluateRunTests(
  tests: TestCase[],
  challenge: Challenge,
  nodes: SimNode[],
  edges: SimEdge[]
): RunTestResult[] {
  return tests.map((t) => {
    const ev = evaluateSingleTest(t, challenge, nodes, edges, { includeChecklist: false });
    return {
      testName: ev.testName,
      passed: ev.passed,
      reason: shortReason(ev.summaryMessage),
    };
  });
}

/**
 * Full submission: visible + hidden tests, checklist, elite score + graph analysis when all pass.
 */
export function evaluateSubmission(
  tests: TestCase[],
  challenge: Challenge,
  nodes: SimNode[],
  edges: SimEdge[]
): ChallengeEvaluationResult {
  const results = tests.map((t) => evaluateSingleTest(t, challenge, nodes, edges, { includeChecklist: true }));
  const overallPass = results.length > 0 && results.every((r) => r.passed);
  const peakTraffic = results.length ? Math.max(...results.map((r) => r.traffic)) : 0;

  if (!overallPass) {
    return {
      tests: results,
      overallPass: false,
      overallScore: 0,
      explainability: null,
      graphInsights: [],
      peakTraffic,
    };
  }

  const peakNodes = simulateTick(nodes, edges, peakTraffic);
  const peakSnapshot = buildSimulationSnapshot(peakNodes, edges, peakTraffic);
  const explainability = computeEliteScore(nodes, edges, peakSnapshot, peakTraffic, challenge);
  const graphInsights = runGraphAnalysis(nodes, edges, peakSnapshot, peakTraffic);

  return {
    tests: results,
    overallPass: true,
    overallScore: explainability.score,
    explainability,
    graphInsights,
    peakTraffic,
  };
}

/** @deprecated Use evaluateRunTests or evaluateSubmission */
const FALLBACK_CHALLENGE: Challenge = {
  id: '_fallback',
  title: '',
  difficulty: 'easy',
  description: '',
  tags: [],
  requirements: [],
  visibleTests: [],
  hiddenTests: [],
};

/** @deprecated Use evaluateRunTests or evaluateSubmission */
export function evaluateTestSuite(
  tests: TestCase[],
  nodes: SimNode[],
  edges: SimEdge[],
  challenge: Challenge = FALLBACK_CHALLENGE
): ChallengeEvaluationResult {
  return evaluateSubmission(tests, challenge, nodes, edges);
}
