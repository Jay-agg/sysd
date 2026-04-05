'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { X, LogIn, CheckCircle2, XCircle, Trophy } from 'lucide-react';

export function LoginModal() {
  const showLoginModal = useChallengeStore((s) => s.showLoginModal);
  const toggleLoginModal = useChallengeStore((s) => s.toggleLoginModal);
  const mockLogin = useChallengeStore((s) => s.mockLogin);

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => toggleLoginModal(false)}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <LogIn size={16} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Login Required</h2>
          </div>
          <button onClick={() => toggleLoginModal(false)} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>
        <p className="text-[13px] text-zinc-400 mb-6 leading-relaxed">
          You need to be logged in to submit solutions and track your progress.
        </p>
        <button
          onClick={mockLogin}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold
            shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          Continue as Guest
        </button>
        <p className="text-[10px] text-zinc-600 text-center mt-3">
          Full auth coming soon • This is a demo login
        </p>
      </div>
    </div>
  );
}

export function SubmitResultModal() {
  const showSubmitModal = useChallengeStore((s) => s.showSubmitModal);
  const toggleSubmitModal = useChallengeStore((s) => s.toggleSubmitModal);
  const score = useChallengeStore((s) => s.score);
  const visibleResults = useChallengeStore((s) => s.visibleTestResults);
  const hiddenResults = useChallengeStore((s) => s.hiddenTestResults);
  const challenge = useChallengeStore((s) => s.currentChallenge);

  if (!showSubmitModal || !challenge) return null;

  const allResults = [...visibleResults, ...hiddenResults];
  const allTests = [...challenge.visibleTests, ...challenge.hiddenTests];
  const passedAll = allResults.every((r) => r.passed);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => toggleSubmitModal(false)}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Trophy size={16} className={passedAll ? 'text-emerald-400' : 'text-amber-400'} />
            <h2 className="text-lg font-bold text-white">
              {passedAll ? 'All Tests Passed!' : 'Submission Results'}
            </h2>
          </div>
          <button onClick={() => toggleSubmitModal(false)} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        {/* Score */}
        <div className={`text-center py-4 mb-4 rounded-xl ${
          (score ?? 0) >= 80 ? 'bg-emerald-500/10' : (score ?? 0) >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'
        }`}>
          <div className={`text-4xl font-bold font-mono ${
            (score ?? 0) >= 80 ? 'text-emerald-400' : (score ?? 0) >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {score}%
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {allResults.filter((r) => r.passed).length}/{allResults.length} tests passed
          </div>
        </div>

        {/* Test checklist */}
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto mb-5">
          {allResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              {r.passed
                ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                : <XCircle size={14} className="text-red-400 shrink-0" />
              }
              <span className="text-[12px] text-zinc-300">{allTests[i]?.name ?? `Test ${i + 1}`}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => toggleSubmitModal(false)}
          className="w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold
            hover:bg-zinc-700 transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
