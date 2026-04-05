import type { PlaygroundEvaluationResult, PlaygroundInsight } from '@/types/evaluation';
import type { Insight } from '@/types/simulation';
import type { SimEdge, SimNode } from '@/types/simulation';
import { analyzeBottlenecks, extractBottlenecks } from './analysis/bottleneckAnalyzer';
import { analyzeLatencyChains } from './analysis/latencyAnalyzer';
import { analyzeReliability } from './analysis/reliabilityAnalyzer';
import { detectSingleInstanceSpofs } from './checkEvaluators/spofCheck';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function severityToInsightSeverity(
  s: PlaygroundInsight['severity']
): Insight['severity'] {
  if (s === 'high') return 'critical';
  if (s === 'medium') return 'warning';
  return 'info';
}

export function mapPlaygroundInsightsToLegacyInsights(insights: PlaygroundInsight[]): Insight[] {
  return insights.map((p, i) => ({
    id: `pg-${p.type}-${p.nodeId ?? i}`,
    message: p.suggestion ? `${p.message} — ${p.suggestion}` : p.message,
    severity: severityToInsightSeverity(p.severity),
    nodeId: p.nodeId,
  }));
}

function analyzeOverload(nodes: SimNode[]): PlaygroundInsight[] {
  const out: PlaygroundInsight[] = [];
  for (const n of nodes) {
    if (n.capacity <= 0) continue;
    if (n.currentLoad > n.capacity) {
      out.push({
        type: 'overload',
        message: `${n.label} is overloaded (${n.currentLoad}/${n.capacity} req/s).`,
        severity: 'high',
        suggestion: 'Increase capacity, add replicas, or shed load upstream.',
        nodeId: n.id,
      });
    }
  }
  return out;
}

function analyzeMissingComponentsHeuristics(nodes: SimNode[], traffic: number): PlaygroundInsight[] {
  const out: PlaygroundInsight[] = [];
  const types = new Set(nodes.map((n) => n.type));
  const hasCache = types.has('cache');
  const hasLb = types.has('loadBalancer');
  const hasQueue = types.has('queue') || types.has('messageBroker');

  const dbTypes = ['database', 'sqlDatabase', 'noSqlDatabase'] as const;
  const dbNodes = nodes.filter((n) => dbTypes.includes(n.type as (typeof dbTypes)[number]));

  const dbStressed = dbNodes.some(
    (n) => n.currentLoad / Math.max(n.capacity, 1e-9) > 0.85
  );
  if (dbNodes.length > 0 && dbStressed && !hasCache) {
    out.push({
      type: 'missing_component',
      message: 'Database tier is under heavy load.',
      severity: 'high',
      suggestion: 'Add a cache for hot reads to protect the database.',
    });
  }

  const appCount = nodes.filter(
    (n) => n.type === 'appServer' || n.type === 'apiGateway'
  ).length;
  if (appCount >= 1 && !hasLb && traffic > 200) {
    out.push({
      type: 'missing_component',
      message: 'Traffic is growing on the application tier without a dedicated load balancer.',
      severity: 'medium',
      suggestion: 'Introduce a load balancer to spread traffic across replicas.',
    });
  }

  const workerCount = nodes.filter((n) => n.type === 'worker').length;
  if (workerCount >= 1 && !hasQueue) {
    out.push({
      type: 'missing_component',
      message: 'Workers detected without an explicit async buffer.',
      severity: 'low',
      suggestion: 'Add a queue or message broker to decouple producers and consumers.',
    });
  }

  return out;
}

function computeScalabilityScore(nodes: SimNode[], spofReasons: string[]): number {
  let s = 58;
  if (nodes.some((n) => n.type === 'loadBalancer')) s += 14;
  if (nodes.some((n) => n.type === 'cache')) s += 8;
  if (nodes.some((n) => n.type === 'queue' || n.type === 'messageBroker')) s += 8;
  s -= spofReasons.length * 12;

  const overload = nodes.some((n) => n.capacity > 0 && n.currentLoad > n.capacity);
  if (overload) s -= 14;

  const maxRatio = Math.max(
    0,
    ...nodes.map((n) => (n.capacity > 0 ? n.currentLoad / n.capacity : 0))
  );
  if (maxRatio > 1) s -= 10;
  else if (maxRatio > 0.9) s -= 4;

  return clamp(Math.round(s), 0, 100);
}

export function dedupePlaygroundInsights(insights: PlaygroundInsight[]): PlaygroundInsight[] {
  const seen = new Set<string>();
  const out: PlaygroundInsight[] = [];
  for (const i of insights) {
    const key = `${i.type}:${i.nodeId ?? i.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
  }
  return out;
}

/**
 * Rule-based playground analysis using **post-simulation** node state (single source of truth).
 * Deterministic: same simulated state + traffic → same insights + score.
 */
export function evaluatePlayground(
  simulatedNodes: SimNode[],
  edges: SimEdge[],
  traffic: number
): PlaygroundEvaluationResult {
  if (simulatedNodes.length === 0) {
    return {
      insights: [],
      score: 0,
    };
  }

  const spofReasons = detectSingleInstanceSpofs(simulatedNodes);

  const merged: PlaygroundInsight[] = [
    ...analyzeOverload(simulatedNodes),
    ...analyzeBottlenecks(simulatedNodes),
    ...analyzeLatencyChains(simulatedNodes, edges),
    ...analyzeReliability(simulatedNodes),
    ...analyzeMissingComponentsHeuristics(simulatedNodes, traffic),
  ];

  const score = computeScalabilityScore(simulatedNodes, spofReasons);
  const bottlenecks = extractBottlenecks(simulatedNodes);

  return { insights: dedupePlaygroundInsights(merged), bottlenecks, score };
}
