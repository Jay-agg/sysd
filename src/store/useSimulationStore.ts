import { create } from 'zustand';
import { SimNode, SimEdge, Insight, SimMetrics, SimNodeType } from '@/types/simulation';
import { simulateTick } from '@/components/simulation/SimulationEngine';
import { urlShortenerScenario } from '@/lib/scenarios/urlShortener';
import { buildSimulationSnapshot } from '@/lib/evaluation/snapshot';
import { evaluatePlayground, mapPlaygroundInsightsToLegacyInsights } from '@/lib/evaluation/playgroundEvaluator';

let _nodeCounter = 100;

interface SimulationState {
  // Data
  nodes: SimNode[];
  edges: SimEdge[];
  traffic: number;
  isRunning: boolean;
  insights: Insight[];
  /** Playground architecture / scalability score (0–100). */
  playgroundScore: number;
  metrics: SimMetrics;
  scenarioName: string;

  // Internal
  _intervalId: ReturnType<typeof setInterval> | null;

  // Actions
  loadScenario: (nodes: SimNode[], edges: SimEdge[], name: string) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  updateTraffic: (value: number) => void;
  tick: () => void;

  // Dynamic node/edge management
  addNode: (type: SimNodeType, label: string, position: { x: number; y: number }, capacity: number, latency: number) => void;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeConfig: (id: string, config: Record<string, any>) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  nodes: urlShortenerScenario.nodes,
  edges: urlShortenerScenario.edges,
  traffic: 0,
  isRunning: false,
  insights: [],
  playgroundScore: 0,
  metrics: { totalRequests: 0, avgLatency: 0, errorPercent: 0 },
  scenarioName: urlShortenerScenario.name,
  _intervalId: null,

  loadScenario: (nodes, edges, name) => {
    const state = get();
    if (state._intervalId) clearInterval(state._intervalId);
    set({
      nodes,
      edges,
      scenarioName: name,
      traffic: 0,
      isRunning: false,
      insights: [],
      playgroundScore: 0,
      metrics: { totalRequests: 0, avgLatency: 0, errorPercent: 0 },
      _intervalId: null,
    });
  },

  startSimulation: () => {
    const state = get();
    if (state.isRunning) return;
    get().tick();
    const id = setInterval(() => { get().tick(); }, 500);
    set({ isRunning: true, _intervalId: id });
  },

  stopSimulation: () => {
    const state = get();
    if (state._intervalId) clearInterval(state._intervalId);
    set({ isRunning: false, _intervalId: null });
  },

  updateTraffic: (value) => {
    set({ traffic: value });
    if (get().isRunning) { get().tick(); }
  },

  tick: () => {
    const { nodes, edges, traffic } = get();
    if (nodes.length === 0) return;
    const updatedNodes = simulateTick(nodes, edges, traffic);
    const snapshot = buildSimulationSnapshot(updatedNodes, edges, traffic);
    const pg = evaluatePlayground(updatedNodes, edges, traffic);
    const insights = mapPlaygroundInsightsToLegacyInsights(pg.insights);
    set({
      nodes: updatedNodes,
      insights,
      playgroundScore: pg.score,
      metrics: {
        totalRequests: traffic,
        avgLatency: snapshot.system.avgLatencyMs,
        errorPercent: Math.round(snapshot.system.maxErrorRatePercent),
      },
    });
  },

  // ── Dynamic management ──

  addNode: (type, label, position, capacity, latency) => {
    const id = `node-${++_nodeCounter}-${Date.now()}`;
    const newNode: SimNode = {
      id,
      label,
      type,
      capacity,
      baseLatency: latency,
      currentLoad: 0,
      latency,
      errorRate: 0,
      status: 'healthy',
      position,
    };
    set((s) => ({ nodes: [...s.nodes, newNode] }));
  },

  removeNode: (id) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    }));
  },

  addEdge: (source, target) => {
    const id = `e-${source}-${target}`;
    // Prevent duplicate edges
    const exists = get().edges.some((e) => e.source === source && e.target === target);
    if (exists) return;
    set((s) => ({ edges: [...s.edges, { id, source, target }] }));
  },

  removeEdge: (id) => {
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }));
  },

  updateNodePosition: (id, position) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    }));
  },

  updateNodeConfig: (id, config) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, config: { ...(n.config || {}), ...config } } : n)),
    }));
    // Trigger recalculation if running, or just trigger tick to update UI
    if (get().isRunning) {
      get().tick();
    } else {
      // Even if paused, we want the node to reflect new potential capacity/behavior?
      // Wait, let's just trigger tick so the visual metrics update immediately
      get().tick();
    }
  },
}));
