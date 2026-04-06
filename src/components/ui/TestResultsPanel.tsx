'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { CheckCircle2, XCircle, FlaskConical, Eye, EyeOff, Lightbulb, Sparkles, Circle } from 'lucide-react';
import type { TestResult } from '@/types/challenge';

function DimBar({ label, value }: { label: string; value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[9px] text-zinc-500">
        <span>{label}</span>
        <span className="font-mono text-zinc-400">{v}</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500/80" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function ResultRow({
  result,
  label,
  hidden = false,
  verbose,
}: {
  result: TestResult;
  label: string;
  hidden?: boolean;
  /** After submit: show checklist. Run Test: short message only. */
  verbose: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all duration-300 ${
        result.passed ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'
      }`}
    >
      {result.passed ? (
        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
      ) : (
        <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[12px] font-medium text-zinc-300">{label}</span>
          {hidden && <EyeOff size={10} className="text-zinc-600" />}
        </div>
        <span className={`text-[11px] ${result.passed ? 'text-emerald-400/80' : 'text-red-400/80'}`}>{result.message}</span>
        {verbose && result.checklist && result.checklist.length > 0 && (
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
  const allTestsPassed = useChallengeStore((s) => s.allTestsPassed);
  const score = useChallengeStore((s) => s.score);
  const scoreBreakdown = useChallengeStore((s) => s.scoreBreakdown);
  const penalties = useChallengeStore((s) => s.penalties);
  const highlights = useChallengeStore((s) => s.highlights);
  const graphInsights = useChallengeStore((s) => s.graphInsights);
  const aiSuggestions = useChallengeStore((s) => s.aiSuggestions);
  const aiLoading = useChallengeStore((s) => s.aiLoading);
  const challenge = useChallengeStore((s) => s.currentChallenge);

  if (!showTestResults || !challenge) return null;

  const allResults = [...visibleResults, ...hiddenResults];
  const passedCount = allResults.filter((r) => r.passed).length;
  const showElite = hasSubmitted && score !== null && scoreBreakdown;
  const idealHints = challenge.idealSolutionCharacteristics ?? [];
  const hasInsightsContent =
    penalties.length > 0 || highlights.length > 0 || graphInsights.length > 0;
  const showSubmissionAnalysis = hasSubmitted && allTestsPassed;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical size={14} className="text-indigo-400 shrink-0" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Test Results</span>
          </div>
          {showElite && (
            <div
              className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-lg shrink-0 ${
                score >= 80 ? 'text-emerald-400 bg-emerald-500/10' : score >= 50 ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'
              }`}
            >
              {score}/100
            </div>
          )}
        </div>

        {showElite && (
          <div className="rounded-lg bg-zinc-800/40 p-3 space-y-2 border border-zinc-800/60">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Breakdown</p>
            <DimBar label="Scalability" value={scoreBreakdown.scalability} />
            <DimBar label="Reliability" value={scoreBreakdown.reliability} />
            <DimBar label="Latency" value={scoreBreakdown.latency} />
            <DimBar label="Architecture" value={scoreBreakdown.architecture} />
            <DimBar label="Efficiency" value={scoreBreakdown.efficiency} />
          </div>
        )}

        {hasSubmitted && !showElite && (
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {passedCount}/{allResults.length} tests passed. Improve the design to unlock scoring and detailed feedback.
          </p>
        )}

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Eye size={12} className="text-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Visible tests</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {visibleResults.map((r, i) => (
              <ResultRow
                key={i}
                result={r}
                label={challenge.visibleTests[i]?.name ?? `Test ${i + 1}`}
                verbose={hasSubmitted}
              />
            ))}
          </div>
        </div>

        {hasSubmitted && hiddenResults.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 mt-1">
              <EyeOff size={12} className="text-zinc-500" />
              <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Hidden tests</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {hiddenResults.map((r, i) => (
                <ResultRow
                  key={i}
                  result={r}
                  label={challenge.hiddenTests[i]?.name ?? `Hidden ${i + 1}`}
                  hidden
                  verbose={hasSubmitted}
                />
              ))}
            </div>
          </div>
        )}

        {/* After full pass: mentor-style analysis in-panel */}
        {showSubmissionAnalysis && (
          <div className="space-y-5 pt-2 border-t border-zinc-800/60 animate-fade-in-up">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Submission Analysis</p>

            {hasInsightsContent && (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb size={12} className="text-amber-400/90" />
                  Insights
                </p>
                <ul className="space-y-1.5 text-[11px] text-zinc-400 leading-relaxed max-h-40 overflow-y-auto">
                  {penalties.map((p, i) => (
                    <li key={`p-${i}`}>
                      <span className="text-amber-500/80">− </span>
                      {p}
                    </li>
                  ))}
                  {highlights.map((h, i) => (
                    <li key={`h-${i}`}>
                      <span className="text-emerald-500/80">+ </span>
                      {h}
                    </li>
                  ))}
                  {graphInsights.map((g, i) => (
                    <li key={`g-${i}`}>• {g.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {idealHints.length > 0 && (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Ideal solution hints</p>
                <ul className="flex flex-col gap-2">
                  {idealHints.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                      <Circle size={6} className="text-zinc-600 mt-1.5 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-violet-400" />
                AI suggestions
              </p>
              {aiLoading && <p className="text-[11px] text-zinc-500">Generating feedback…</p>}
              {!aiLoading && aiSuggestions && aiSuggestions.length === 0 && (
                <p className="text-[11px] text-zinc-500">Configure API keys for AI suggestions.</p>
              )}
              {!aiLoading && aiSuggestions && aiSuggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="rounded-lg border border-zinc-800/60 bg-zinc-800/30 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[12px] font-medium text-zinc-200">{s.title}</span>
                        <span
                          className={`text-[9px] uppercase font-semibold shrink-0 px-1.5 py-0.5 rounded ${
                            s.impact === 'high'
                              ? 'bg-red-500/15 text-red-400'
                              : s.impact === 'medium'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {s.impact}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{s.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
