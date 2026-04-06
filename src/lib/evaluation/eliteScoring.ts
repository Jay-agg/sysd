import type { Challenge } from '@/types/challenge';
import type { SimulationSnapshot } from '@/types/evaluation';
import type { ExplainabilityOutput, ScoreBreakdown } from '@/types/evaluation';
import type { SimEdge, SimNode } from '@/types/simulation';
import { detectPatterns } from './graph/patternDetector';
import { detectSingleInstanceSpofs } from './checkEvaluators/spofCheck';

const DEFAULT_W = {
  scalability: 0.25,
  reliability: 0.25,
  latency: 0.2,
  architecture: 0.2,
  efficiency: 0.1,
} as const;

type DimWeights = Record<keyof ScoreBreakdown, number>;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function logBonus(n: number, scale: number, cap: number): number {
  return Math.min(cap, scale * Math.log2(1 + Math.max(0, n)));
}

function variance(xs: number[]): number {
  if (xs.length === 0) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
}

/**
 * Maps question-bank `evaluationCriteria` to 5-dimension weights (normalized to sum 1).
 */
export function getEliteWeights(challenge: Challenge | null | undefined): DimWeights {
  const ec = challenge?.evaluationCriteria;
  if (!ec) {
    return { ...DEFAULT_W };
  }

  const s = ec.scalability;
  const r = ec.reliability;
  const l = ec.latency;
  const a = ec.architecture;
  const e = ec.efficiency;

  if (
    typeof s === 'number' &&
    typeof r === 'number' &&
    typeof l === 'number' &&
    typeof a === 'number' &&
    typeof e === 'number'
  ) {
    const sum = s + r + l + a + e;
    if (sum > 0) {
      return {
        scalability: s / sum,
        reliability: r / sum,
        latency: l / sum,
        architecture: a / sum,
        efficiency: e / sum,
      };
    }
  }

  if (typeof s === 'number' && typeof r === 'number' && typeof l === 'number') {
    const t = s + r + l;
    if (t <= 0) {
      return { ...DEFAULT_W };
    }
    return {
      scalability: (s / t) * 0.75,
      reliability: (r / t) * 0.75,
      latency: (l / t) * 0.75,
      architecture: 0.15,
      efficiency: 0.1,
    };
  }

  return { ...DEFAULT_W };
}

function patternMatchesToken(token: string, patterns: ReturnType<typeof detectPatterns>): boolean {
  const k = token.trim().toLowerCase().replace(/\s+/g, '_');
  switch (k) {
    case 'async_processing':
      return patterns.async_processing;
    case 'caching':
      return patterns.caching;
    case 'horizontal_scaling':
      return patterns.horizontal_scaling;
    case 'load_balancing':
      return patterns.load_balancing;
    default:
      return false;
  }
}

/** datav3 uses full sentences; map keywords → pattern signals (deterministic). */
function narrativeExpectedSatisfied(text: string, patterns: ReturnType<typeof detectPatterns>): boolean {
  const s = text.toLowerCase();
  const need: boolean[] = [];
  if (s.includes('cache') || s.includes('caching')) need.push(patterns.caching);
  if (s.includes('horizontal') || (s.includes('scale') && (s.includes('app') || s.includes('server') || s.includes('fleet')))) {
    need.push(patterns.horizontal_scaling);
  }
  if (s.includes('async') || s.includes('queue') || s.includes('broker') || s.includes('message bus')) {
    need.push(patterns.async_processing);
  }
  if (s.includes('load balanc')) need.push(patterns.load_balancing);
  if (need.length === 0) return true;
  return need.every(Boolean);
}

function expectedPatternSatisfied(text: string, patterns: ReturnType<typeof detectPatterns>): boolean {
  const t = text.trim();
  if (patternMatchesToken(t, patterns)) return true;
  return narrativeExpectedSatisfied(t, patterns);
}

/**
 * Deterministic 5-dimension score + explainability. Only call when all tests passed.
 */
export function computeEliteScore(
  nodes: SimNode[],
  edges: SimEdge[],
  snapshot: SimulationSnapshot,
  peakTraffic: number,
  challenge?: Challenge | null
): ExplainabilityOutput {
  const patterns = detectPatterns(nodes, edges);
  const spofReasons = detectSingleInstanceSpofs(nodes);
  const weights = getEliteWeights(challenge ?? null);

  const penalties: string[] = [];
  const highlights: string[] = [];

  const dbNodes = nodes.filter((n) => ['database', 'sqlDatabase', 'noSqlDatabase'].includes(n.type));
  const totalShards = dbNodes.reduce((s, n) => s + (n.config?.shards ?? 1), 0);
  const minDbReplicas = dbNodes.length ? Math.min(...dbNodes.map((n) => n.config?.replicas ?? 1)) : 0;

  const appNodes = nodes.filter((n) => n.type === 'appServer');
  const appUtils = appNodes.map((n) => snapshot.perNode[n.id]?.utilization ?? 0);
  const loadSpreadVar = variance(appUtils);

  let anyOverload = false;
  let maxUtil = 0;
  let dbBottleneck = false;
  for (const n of nodes) {
    const u = snapshot.perNode[n.id]?.utilization ?? 0;
    maxUtil = Math.max(maxUtil, u);
    if (u > 1) anyOverload = true;
    if (['database', 'sqlDatabase', 'noSqlDatabase'].includes(n.type) && (n.config?._writeBottleneck || n.config?._readBottleneck || u > 1)) {
      dbBottleneck = true;
    }
  }

  if (spofReasons.length > 0) {
    penalties.push('Single point of failure on critical tier (−25 reliability).');
  }
  if (dbBottleneck) {
    penalties.push('Database is a bottleneck on the critical path (−20 architecture).');
  }
  if (peakTraffic > 1000 && !patterns.has_load_balancer) {
    penalties.push('No load balancer under high load (−15 architecture).');
  }
  if (loadSpreadVar > 0.04 && appNodes.length >= 2) {
    penalties.push('Uneven load across app tier reduces effective scalability.');
  }

  if (patterns.caching) highlights.push('Cache tier absorbs read pressure.');
  if (patterns.async_processing) highlights.push('Async pipeline decouples producers from consumers.');
  if (patterns.load_balancing) highlights.push('Traffic spreading reduces per-node stress.');
  if (minDbReplicas >= 2) highlights.push('Database replication improves read availability.');

  const ap = new Set(challenge?.antiPatterns ?? []);
  if (ap.has('single_point_of_failure') && spofReasons.length > 0) {
    penalties.push('[Criteria] Single point of failure conflicts with problem anti-patterns.');
  }
  if ((ap.has('no_async_processing') || ap.has('synchronous_processing')) && !patterns.async_processing) {
    penalties.push('[Criteria] Missing async processing path flagged as an anti-pattern for this problem.');
  }
  if (ap.has('db_bottleneck') && dbBottleneck) {
    penalties.push('[Criteria] Database bottleneck matches an anti-pattern for this problem.');
  }

  const exp = challenge?.expectedPatterns ?? [];
  for (const line of exp) {
    if (expectedPatternSatisfied(line, patterns)) {
      const short = line.length > 90 ? `${line.slice(0, 87)}…` : line;
      highlights.push(`Matches expected design theme: ${short}`);
    } else {
      const short = line.length > 90 ? `${line.slice(0, 87)}…` : line;
      penalties.push(`Expected design theme not fully met: ${short}`);
    }
  }

  // —— Scalability ——
  let scalability = 35;
  scalability += logBonus(totalShards, 12, 28);
  scalability += logBonus(appNodes.length, 8, 18);
  if (patterns.has_load_balancer) scalability += 12;
  scalability -= Math.min(22, loadSpreadVar * 120);
  if (anyOverload) scalability -= 18;
  scalability = clamp(Math.round(scalability), 0, 100);

  // —— Reliability ——
  let reliability = 45;
  reliability += logBonus(minDbReplicas, 18, 35);
  if (spofReasons.length > 0) reliability -= 25;
  reliability = clamp(Math.round(reliability), 0, 100);

  // —— Latency ——
  let latency = 55;
  if (patterns.caching) latency += 18;
  if (patterns.async_processing) latency += 12;
  latency -= Math.min(35, maxUtil * 28);
  if (snapshot.system.maxLatencyMs > 200) {
    latency -= Math.min(15, Math.round((snapshot.system.maxLatencyMs - 200) / 20));
  }
  latency = clamp(Math.round(latency), 0, 100);

  // —— Architecture ——
  let architecture = 50;
  if (patterns.async_processing) architecture += 14;
  if (patterns.caching) architecture += 8;
  if (patterns.has_load_balancer) architecture += 10;
  if (!patterns.direct_api_to_db) architecture += 12;
  else architecture -= 20;
  if (peakTraffic > 1000 && !patterns.has_load_balancer) architecture -= 15;
  if (dbBottleneck) architecture -= 20;
  architecture = clamp(Math.round(architecture), 0, 100);

  // —— Efficiency ——
  let efficiency = 92;
  const nComp = nodes.filter((n) => !['webClient', 'mobileClient'].includes(n.type)).length;
  efficiency -= Math.max(0, (nComp - 12) * 3);
  let excessReplica = 0;
  for (const n of dbNodes) {
    const r = n.config?.replicas ?? 1;
    if (r > 6) excessReplica += r - 6;
  }
  efficiency -= excessReplica * 4;
  efficiency -= Math.max(0, totalShards - 24) * 2;
  efficiency = clamp(Math.round(efficiency), 0, 100);

  const breakdown: ScoreBreakdown = {
    scalability,
    reliability,
    latency,
    architecture,
    efficiency,
  };

  const score = Math.round(
    weights.scalability * breakdown.scalability +
      weights.reliability * breakdown.reliability +
      weights.latency * breakdown.latency +
      weights.architecture * breakdown.architecture +
      weights.efficiency * breakdown.efficiency
  );

  return {
    score: clamp(score, 0, 100),
    breakdown,
    penalties,
    highlights,
  };
}
