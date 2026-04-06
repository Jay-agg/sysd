'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { Send, FlaskConical } from 'lucide-react';

import { getChallengeById } from '@/lib/challenges';
import { useChallengeStore } from '@/store/useChallengeStore';
import { useSimulationStore } from '@/store/useSimulationStore';

import AppNavbar from '@/components/ui/AppNavbar';
import CollapsibleAside from '@/components/ui/CollapsibleAside';
import ProblemPanel from '@/components/ui/ProblemPanel';
import ComponentLibrary from '@/components/ui/ComponentLibrary';
import FlowCanvas from '@/components/canvas/FlowCanvas';
import TestResultsPanel from '@/components/ui/TestResultsPanel';
import { LoginModal, SubmitResultModal } from '@/components/ui/Modals';

export default function ChallengePage() {
  const params = useParams();
  const challengeId = params.id as string;
  const [showTests, setShowTests] = useState(false);

  const setChallenge = useChallengeStore((s) => s.setChallenge);
  const challenge = useChallengeStore((s) => s.currentChallenge);
  const runVisibleTests = useChallengeStore((s) => s.runVisibleTests);
  const runAllTests = useChallengeStore((s) => s.runAllTests);
  const isLoggedIn = useChallengeStore((s) => s.isLoggedIn);
  const toggleLoginModal = useChallengeStore((s) => s.toggleLoginModal);
  const showTestResults = useChallengeStore((s) => s.showTestResults);

  const nodes = useSimulationStore((s) => s.nodes);
  const edges = useSimulationStore((s) => s.edges);
  const loadScenario = useSimulationStore((s) => s.loadScenario);

  useEffect(() => {
    const c = getChallengeById(challengeId);
    if (c) {
      setChallenge(c);
      // Load a clean canvas for the challenge
      loadScenario([], [], c.title);
    }
  }, [challengeId, setChallenge, loadScenario]);

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#09090b] text-zinc-500">
        Challenge not found
      </div>
    );
  }

  const handleRunTest = () => {
    runVisibleTests(nodes, edges);
    setShowTests(true);
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toggleLoginModal(true);
      return;
    }
    await runAllTests(nodes, edges);
    setShowTests(true);
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-[#09090b] overflow-hidden">
        {/* Navbar with CTAs */}
        <AppNavbar
          rightContent={
            <>
              <button
                onClick={handleRunTest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold
                  bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700
                  transition-all cursor-pointer"
              >
                <FlaskConical size={14} />
                Run Test
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-semibold
                  bg-gradient-to-r from-indigo-600 to-violet-600 text-white
                  shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                  hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send size={14} />
                Submit
              </button>
            </>
          }
        />

        {/* 3-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Problem Panel */}
          <CollapsibleAside side="left" expandedClassName="w-[360px]" label="problem">
            <div className="flex flex-1 flex-col overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0">
                <ProblemPanel challenge={challenge} />
              </div>

              {showTestResults && showTests && (
                <>
                  <div className="h-px bg-zinc-800/60 shrink-0" />
                  <div className="max-h-[42%] overflow-y-auto min-h-0 border-t border-zinc-800/30">
                    <TestResultsPanel />
                  </div>
                </>
              )}
            </div>
          </CollapsibleAside>

          {/* Center — Canvas */}
          <main className="relative z-0 flex-1 min-w-0">
            <FlowCanvas />
          </main>

          {/* Right — Component Library */}
          <CollapsibleAside side="right" expandedClassName="w-60" label="component library">
            <div className="flex-1 overflow-hidden flex flex-col pt-2 min-h-0">
              <ComponentLibrary />
            </div>
          </CollapsibleAside>
        </div>
      </div>

      {/* Modals */}
      <LoginModal />
      <SubmitResultModal />
    </ReactFlowProvider>
  );
}
