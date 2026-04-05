import { create } from 'zustand';
import type { Challenge, TestResult } from '@/types/challenge';
import type { SingleTestEvaluation } from '@/types/evaluation';
import type { SimNode, SimEdge } from '@/types/simulation';
import { evaluateTestSuite } from '@/lib/evaluation/challengeEvaluator';

interface ChallengeState {
  currentChallenge: Challenge | null;
  isLoggedIn: boolean;

  visibleTestResults: TestResult[];
  hiddenTestResults: TestResult[];
  showTestResults: boolean;

  hasSubmitted: boolean;
  score: number | null;
  showSubmitModal: boolean;
  showLoginModal: boolean;

  setChallenge: (challenge: Challenge) => void;
  runVisibleTests: (nodes: SimNode[], edges: SimEdge[]) => void;
  runAllTests: (nodes: SimNode[], edges: SimEdge[]) => void;
  toggleLoginModal: (show: boolean) => void;
  toggleSubmitModal: (show: boolean) => void;
  mockLogin: () => void;
  resetResults: () => void;
}

function mapEval(r: SingleTestEvaluation): TestResult {
  return {
    passed: r.passed,
    message: r.summaryMessage,
    checklist: r.checklist,
    score: r.score,
  };
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  currentChallenge: null,
  isLoggedIn: false,
  visibleTestResults: [],
  hiddenTestResults: [],
  showTestResults: false,
  hasSubmitted: false,
  score: null,
  showSubmitModal: false,
  showLoginModal: false,

  setChallenge: (challenge) => {
    set({
      currentChallenge: challenge,
      visibleTestResults: [],
      hiddenTestResults: [],
      showTestResults: false,
      hasSubmitted: false,
      score: null,
    });
  },

  runVisibleTests: (nodes, edges) => {
    const challenge = get().currentChallenge;
    if (!challenge) return;
    const ev = evaluateTestSuite(challenge.visibleTests, nodes, edges);
    set({
      visibleTestResults: ev.tests.map(mapEval),
      showTestResults: true,
    });
  },

  runAllTests: (nodes, edges) => {
    const challenge = get().currentChallenge;
    if (!challenge) return;
    const all = [...challenge.visibleTests, ...challenge.hiddenTests];
    const ev = evaluateTestSuite(all, nodes, edges);
    const v = challenge.visibleTests.length;
    set({
      visibleTestResults: ev.tests.slice(0, v).map(mapEval),
      hiddenTestResults: ev.tests.slice(v).map(mapEval),
      showTestResults: true,
      hasSubmitted: true,
      score: ev.overallScore,
      showSubmitModal: true,
    });
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
      score: null,
    }),
}));
