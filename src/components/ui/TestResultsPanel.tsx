'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { CheckCircle2, XCircle, FlaskConical, Eye, EyeOff } from 'lucide-react';
import type { TestResult } from '@/types/challenge';

function ResultRow({ result, label, hidden = false }: { result: TestResult; label: string; hidden?: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all duration-300 ${
      result.passed
        ? 'bg-emerald-500/5 border-emerald-500/15'
        : 'bg-red-500/5 border-red-500/15'
    }`}>
      {result.passed
        ? <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
        : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[12px] font-medium text-zinc-300">{label}</span>
          {hidden && <EyeOff size={10} className="text-zinc-600" />}
          {result.score != null && result.passed && (
            <span className="text-[10px] font-mono text-zinc-500">{result.score}</span>
          )}
        </div>
        <span className={`text-[11px] ${result.passed ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
          {result.message}
        </span>
        {result.checklist && result.checklist.length > 0 && (
          <ul className="mt-2 space-y-1 border-t border-zinc-800/50 pt-2">
            {result.checklist.map((c) => (
              <li key={c.id} className="flex items-start gap-1.5 text-[10px] text-zinc-500 leading-snug">
                <span className={c.passed ? 'text-emerald-500/90' : 'text-red-400/90'}>{c.passed ? '✓' : '✗'}</span>
                <span>
                  <span className="text-zinc-400">{c.label}:</span> {c.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function TestResultsPanel() {
  const visibleResults = useChallengeStore((s) => s.visibleTestResults);
  const hiddenResults = useChallengeStore((s) => s.hiddenTestResults);
  const showTestResults = useChallengeStore((s) => s.showTestResults);
  const hasSubmitted = useChallengeStore((s) => s.hasSubmitted);
  const score = useChallengeStore((s) => s.score);
  const challenge = useChallengeStore((s) => s.currentChallenge);

  if (!showTestResults || !challenge) return null;

  const allResults = [...visibleResults, ...hiddenResults];
  const passedCount = allResults.filter((r) => r.passed).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical size={14} className="text-indigo-400" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Test Results</span>
          </div>
          {hasSubmitted && score !== null && (
            <div className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-lg ${
              score >= 80 ? 'text-emerald-400 bg-emerald-500/10' :
              score >= 50 ? 'text-amber-400 bg-amber-500/10' :
              'text-red-400 bg-red-500/10'
            }`}>
              {score}%
            </div>
          )}
        </div>

        {/* Score bar */}
        {hasSubmitted && (
          <div className="rounded-lg bg-zinc-800/40 p-3 mb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-zinc-500">
                {passedCount}/{allResults.length} tests passed
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  (score ?? 0) >= 80 ? 'bg-emerald-400' :
                  (score ?? 0) >= 50 ? 'bg-amber-400' :
                  'bg-red-400'
                }`}
                style={{ width: `${score ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Visible test results */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Eye size={12} className="text-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Visible Tests</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {visibleResults.map((r, i) => (
              <ResultRow key={i} result={r} label={challenge.visibleTests[i]?.name ?? `Test ${i + 1}`} />
            ))}
          </div>
        </div>

        {/* Hidden test results (only after submit) */}
        {hasSubmitted && hiddenResults.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 mt-1">
              <EyeOff size={12} className="text-zinc-500" />
              <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Hidden Tests</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {hiddenResults.map((r, i) => (
                <ResultRow key={i} result={r} label={challenge.hiddenTests[i]?.name ?? `Hidden ${i + 1}`} hidden />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
