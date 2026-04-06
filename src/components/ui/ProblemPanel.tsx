'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Challenge } from '@/types/challenge';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, FileText, Target, Building2, Scale, Sparkles, ShieldAlert } from 'lucide-react';

/** Fixed + portaled so it stacks above React Flow (internal z-index up to ~1001) and escapes sidebar overflow. */
const TOOLTIP_Z = 1100;

function MoreTagsTooltip({ restTags, restCount }: { restTags: string[]; restCount: number }) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePos();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePos]);

  const tooltip =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        role="tooltip"
        aria-hidden={true}
        style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: TOOLTIP_Z }}
        className="pointer-events-none box-border w-[min(240px,calc(100vw-2rem))] rounded-lg border border-zinc-700/80 bg-zinc-900 px-2.5 py-2 text-[11px] leading-snug text-zinc-300 shadow-lg"
      >
        <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">More tags</span>
        <span className="flex flex-wrap gap-1">
          {restTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
        </span>
      </div>,
      document.body
    );

  return (
    <>
      <span
        ref={triggerRef}
        className="text-[10px] font-medium text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded-md cursor-default border border-zinc-700/50 outline-none"
        tabIndex={0}
        aria-label={`${restCount} more tags: ${restTags.join(', ')}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        +{restCount}
      </span>
      {tooltip}
    </>
  );
}

export default function ProblemPanel({ challenge }: { challenge: Challenge }) {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const diffColor = {
    easy: 'text-emerald-400 bg-emerald-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    hard: 'text-red-400 bg-red-500/10',
  }[challenge.difficulty];

  const tagChips = challenge.tags.slice(0, 2);
  const restTags = challenge.tags.slice(2);
  const restCount = restTags.length;

  const scaleExp = challenge.scalingExpectations;
  const companyTags = challenge.companyTags ?? [];
  const expectedPatterns = challenge.expectedPatterns ?? [];
  const antiPatterns = challenge.antiPatterns ?? [];
  const chCaps = challenge.requiredCapabilities ?? [];

  const hasGuidanceContent =
    Boolean(scaleExp) ||
    chCaps.length > 0 ||
    expectedPatterns.length > 0 ||
    antiPatterns.length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-5 flex flex-col gap-7">
        {/* Title — primary focus */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white tracking-tight leading-snug">{challenge.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${diffColor}`}>
              {challenge.difficulty}
            </span>
            {tagChips.map((tag) => (
              <span key={tag} className="text-[10px] font-medium text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
            {restCount > 0 && <MoreTagsTooltip restTags={restTags} restCount={restCount} />}
          </div>
          {companyTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Building2 size={12} className="text-zinc-600 shrink-0" />
              {companyTags.map((c) => (
                <span key={c} className="text-[9px] font-medium text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/40">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <FileText size={13} className="text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Description</span>
          </div>
          <p className="text-[13px] text-zinc-400 leading-relaxed whitespace-pre-line">{challenge.description}</p>
        </section>

        {/* Requirements — always visible */}
        <section className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Target size={13} className="text-indigo-400" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Requirements</span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {challenge.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12px] text-zinc-400 leading-relaxed">
                <Circle size={6} className="text-zinc-600 mt-1.5 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* Optional guidance — collapsed by default */}
        {hasGuidanceContent && (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 overflow-hidden transition-colors hover:border-zinc-800/90">
            <button
              type="button"
              onClick={() => setGuidanceOpen(!guidanceOpen)}
              className="flex items-center gap-2 w-full text-left px-3.5 py-3 cursor-pointer group"
              aria-expanded={guidanceOpen}
            >
              {guidanceOpen ? (
                <ChevronDown size={15} className="text-zinc-500 shrink-0 transition-transform duration-200" />
              ) : (
                <ChevronRight size={15} className="text-zinc-500 shrink-0 transition-transform duration-200" />
              )}
              <span className="text-[12px] font-semibold text-zinc-300">Guidance (Optional)</span>
              <span className="text-[10px] text-zinc-600 ml-auto">Patterns and expectations</span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
              style={{ gridTemplateRows: guidanceOpen ? '1fr' : '0fr' }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="px-3.5 pb-4 pt-0 space-y-5 border-t border-zinc-800/50 animate-fade-in-up">
                  {(scaleExp || chCaps.length > 0) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        <Scale size={13} className="text-indigo-400/90" />
                        Design expectations
                      </div>
                      {scaleExp && (
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          <span className="text-zinc-500">DB replicas (min):</span>{' '}
                          <span className="font-mono text-zinc-300">{scaleExp.minReplicas}</span>
                          <span className="text-zinc-600 mx-2">·</span>
                          <span className="text-zinc-500">Shards (min):</span>{' '}
                          <span className="font-mono text-zinc-300">{scaleExp.minShards}</span>
                        </p>
                      )}
                      {chCaps.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {chCaps.map((c) => (
                            <span
                              key={c}
                              className="text-[9px] font-medium text-indigo-300/90 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                            >
                              {c.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {expectedPatterns.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-400/80" />
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Expected patterns</span>
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {expectedPatterns.map((p) => (
                          <li key={p} className="text-[11px] text-zinc-400 pl-2 border-l border-emerald-500/30 leading-relaxed">
                            {p.replace(/_/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {antiPatterns.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-amber-400/80" />
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Anti-patterns</span>
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {antiPatterns.map((p) => (
                          <li key={p} className="text-[11px] text-zinc-400 pl-2 border-l border-amber-500/30 leading-relaxed">
                            {p.replace(/_/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visible tests — minimal */}
        <section className="space-y-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400/90" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Test cases</span>
            <span className="text-[10px] text-zinc-600 ml-auto">{challenge.visibleTests.length} sample</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {challenge.visibleTests.map((test, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-zinc-800/35 border border-zinc-800/55 px-3.5 py-3 transition-colors hover:border-zinc-700/60"
              >
                <div className="text-[12px] font-semibold text-zinc-300 mb-2.5">{test.name}</div>
                <div className="flex flex-col gap-2 text-[11px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">Traffic</span>
                    <span className="font-mono text-zinc-200 tabular-nums">{test.input.traffic} rps</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wide">Constraints</span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      {[
                        test.checks.maxLatency != null && `≤${test.checks.maxLatency} ms latency`,
                        test.checks.maxErrorRate != null && `≤${test.checks.maxErrorRate}% errors`,
                        test.checks.minThroughput != null && `≥${test.checks.minThroughput} rps throughput`,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Structural / capability checks (no fixed latency SLA in this sample).'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
