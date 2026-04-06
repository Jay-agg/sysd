import { create } from 'zustand';
import type { Challenge, TestResult } from '@/types/challenge';
import type {
  AiSuggestion,
  GraphInsightItem,
  ScoreBreakdown,
  SingleTestEvaluation,
} from '@/types/evaluation';
import type { SimNode, SimEdge } from '@/types/simulation';
import { evaluateRunTests, evaluateSubmission } from '@/lib/evaluation/challengeEvaluator';

interface ChallengeState {
  currentChallenge: Challenge | null;
  isLoggedIn: boolean;

  visibleTestResults: TestResult[];
  hiddenTestResults: TestResult[];
  showTestResults: boolean;

  hasSubmitted: boolean;
  /** True after Submit when every visible + hidden test passed. */
  allTestsPassed: boolean;
  score: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  penalties: string[];
  highlights: string[];
  graphInsights: GraphInsightItem[];
  aiSuggestions: AiSuggestion[] | null;
  aiLoading: boolean;

  showSubmitModal: boolean;
  showLoginModal: boolean;

  setChallenge: (challenge: Challenge) => void;
  runVisibleTests: (nodes: SimNode[], edges: SimEdge[]) => void;
  runAllTests: (nodes: SimNode[], edges: SimEdge[]) => Promise<void>;
  toggleLoginModal: (show: boolean) => void;
  toggleSubmitModal: (show: boolean) => void;
  mockLogin: () => void;
  resetResults: () => void;
}

function mapSubmitEval(r: SingleTestEvaluation): TestResult {
  return {
    passed: r.passed,
    message: r.summaryMessage,
    checklist: r.checklist,
  };
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  currentChallenge: null,
  isLoggedIn: false,
  visibleTestResults: [],
  hiddenTestResults: [],
  showTestResults: false,
  hasSubmitted: false,
  allTestsPassed: false,
  score: null,
  scoreBreakdown: null,
  penalties: [],
  highlights: [],
  graphInsights: [],
  aiSuggestions: null,
  aiLoading: false,
  showSubmitModal: false,
  showLoginModal: false,

  setChallenge: (challenge) => {
    set({
      currentChallenge: challenge,
      visibleTestResults: [],
      hiddenTestResults: [],
      showTestResults: false,
      hasSubmitted: false,
      allTestsPassed: false,
      score: null,
      scoreBreakdown: null,
      penalties: [],
      highlights: [],
      graphInsights: [],
      aiSuggestions: null,
      aiLoading: false,
      showSubmitModal: false,
    });
  },

  runVisibleTests: (nodes, edges) => {
    const challenge = get().currentChallenge;
    if (!challenge) return;
    const run = evaluateRunTests(challenge.visibleTests, challenge, nodes, edges);
    set({
      visibleTestResults: run.map((r) => ({
        passed: r.passed,
        message: r.reason,
      })),
      hiddenTestResults: [],
      showTestResults: true,
      hasSubmitted: false,
      allTestsPassed: false,
      score: null,
      scoreBreakdown: null,
      penalties: [],
      highlights: [],
      graphInsights: [],
      aiSuggestions: null,
      aiLoading: false,
    });
  },

  runAllTests: async (nodes, edges) => {
    const challenge = get().currentChallenge;
    if (!challenge) return;
    const all = [...challenge.visibleTests, ...challenge.hiddenTests];
    const ev = evaluateSubmission(all, challenge, nodes, edges);
    const v = challenge.visibleTests.length;

    set({
      visibleTestResults: ev.tests.slice(0, v).map(mapSubmitEval),
      hiddenTestResults: ev.tests.slice(v).map(mapSubmitEval),
      showTestResults: true,
      hasSubmitted: true,
      allTestsPassed: ev.overallPass,
      score: ev.overallPass ? ev.overallScore : null,
      scoreBreakdown: ev.explainability?.breakdown ?? null,
      penalties: ev.explainability?.penalties ?? [],
      highlights: ev.explainability?.highlights ?? [],
      graphInsights: ev.graphInsights,
      showSubmitModal: !ev.overallPass,
      aiSuggestions: null,
      aiLoading: Boolean(ev.overallPass && ev.explainability),
    });

    if (ev.overallPass && ev.explainability) {
      try {
        const res = await fetch('/api/challenge/ai-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            architecture: {
              nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type,
                label: n.label,
                config: n.config,
              })),
              edges,
            },
            simulationResults: {
              peakTraffic: ev.peakTraffic,
              score: ev.explainability.score,
              breakdown: ev.explainability.breakdown,
            },
            scoreBreakdown: ev.explainability.breakdown,
            penalties: ev.explainability.penalties,
            highlights: ev.explainability.highlights,
            graphInsights: ev.graphInsights,
          }),
        });
        const data = (await res.json()) as { suggestions?: AiSuggestion[] };
        set({
          aiSuggestions: data.suggestions ?? [],
          aiLoading: false,
        });
      } catch {
        set({ aiLoading: false });
      }
    } else {
      set({ aiLoading: false });
    }
  },

  toggleLoginModal: (show) => set({ showLoginModal: show }),
  toggleSubmitModal: (show) => set({ showSubmitModal: show }),
  mockLogin: () => set({ isLoggedIn: true, showLoginModal: false }),
  resetResults: () =>
    set({
      visibleTestResults: [],
      hiddenTestResults: [],
      showTestResults: false,
      hasSubmitted: false,
      allTestsPassed: false,
      score: null,
      scoreBreakdown: null,
      penalties: [],
      highlights: [],
      graphInsights: [],
      aiSuggestions: null,
      aiLoading: false,
      showSubmitModal: false,
    }),
}));
