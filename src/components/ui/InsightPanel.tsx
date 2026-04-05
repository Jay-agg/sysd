'use client';

import { useSimulationStore } from '@/store/useSimulationStore';
import type { Insight } from '@/types/simulation';

const severityConfig = {
  info: {
    border: 'border-indigo-500/15',
    bg: 'bg-indigo-500/5',
    glow: 'hover:shadow-indigo-500/5',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-400',
    text: 'text-indigo-300/90',
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-1.006 0-1.96.44-2.611 1.218L8.875 17.05" />
      </svg>
    ),
  },
  warning: {
    border: 'border-amber-500/15',
    bg: 'bg-amber-500/5',
    glow: 'hover:shadow-amber-500/5',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    text: 'text-amber-300/90',
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  critical: {
    border: 'border-red-500/15',
    bg: 'bg-red-500/5',
    glow: 'hover:shadow-red-500/5',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    text: 'text-red-300/90',
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
};

function InsightCard({ insight }: { insight: Insight }) {
  const config = severityConfig[insight.severity];

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border p-3 transition-all duration-300 shadow-lg shadow-black/10 ${config.border} ${config.bg} ${config.glow} animate-fade-in-up`}
    >
      <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 ${config.iconBg} ${config.iconColor}`}>
        {config.icon}
      </div>
      <p className={`text-xs leading-relaxed ${config.text}`}>{insight.message}</p>
    </div>
  );
}

export default function InsightPanel() {
  const insights = useSimulationStore((s) => s.insights);
  const isRunning = useSimulationStore((s) => s.isRunning);
  const playgroundScore = useSimulationStore((s) => s.playgroundScore);
  const traffic = useSimulationStore((s) => s.traffic);

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-1">
        <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-1.006 0-1.96.44-2.611 1.218L8.875 17.05" />
        </svg>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Insights</span>
        <div className="ml-auto flex items-center gap-2">
          {(traffic > 0 || insights.length > 0) && (
            <span
              className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                playgroundScore >= 75 ? 'text-emerald-400 bg-emerald-500/10' :
                playgroundScore >= 50 ? 'text-amber-400 bg-amber-500/10' :
                'text-zinc-500 bg-zinc-800/60'
              }`}
              title="Architecture / scalability score (rule-based)"
            >
              {playgroundScore}
            </span>
          )}
          {insights.length > 0 && (
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">{insights.length}</span>
          )}
        </div>
      </div>

      {/* Insights Container */}
      <div className="rounded-2xl bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/60 p-3 shadow-lg shadow-black/20 flex-1 min-h-0 overflow-hidden flex flex-col">
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-1.006 0-1.96.44-2.611 1.218L8.875 17.05" />
              </svg>
            </div>
            <p className="text-xs text-zinc-600 max-w-[180px]">
              {isRunning
                ? 'System healthy — no issues detected'
                : 'Increase traffic to discover insights'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto flex-1 stagger-children">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
