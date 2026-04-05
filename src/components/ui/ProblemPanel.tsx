'use client';

import { useState } from 'react';
import type { Challenge } from '@/types/challenge';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, FileText, Target } from 'lucide-react';

export default function ProblemPanel({ challenge }: { challenge: Challenge }) {
  const [reqOpen, setReqOpen] = useState(true);

  const diffColor = {
    easy: 'text-emerald-400 bg-emerald-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    hard: 'text-red-400 bg-red-500/10',
  }[challenge.difficulty];

  // We are removing the constraints since the new DB format doesn't have it.

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-5 flex flex-col gap-5">
        {/* Title + Difficulty */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${diffColor}`}>
              {challenge.difficulty}
            </span>
            {challenge.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-medium text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{challenge.title}</h1>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={13} className="text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Description</span>
          </div>
          <p className="text-[13px] text-zinc-400 leading-relaxed whitespace-pre-line">
            {challenge.description}
          </p>
        </div>

        {/* Requirements — collapsible */}
        <div>
          <button
            onClick={() => setReqOpen(!reqOpen)}
            className="flex items-center gap-1.5 w-full text-left cursor-pointer group mb-2"
          >
            {reqOpen ? <ChevronDown size={13} className="text-zinc-500" /> : <ChevronRight size={13} className="text-zinc-500" />}
            <Target size={13} className="text-indigo-400" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Requirements</span>
            <span className="text-[10px] text-zinc-600 ml-auto">{challenge.requirements.length}</span>
          </button>
          {reqOpen && (
            <ul className="flex flex-col gap-1.5 animate-fade-in-up">
              {challenge.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-400 leading-relaxed">
                  <Circle size={6} className="text-zinc-600 mt-1.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visible Test Cases */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Test Cases</span>
            <span className="text-[10px] text-zinc-600 ml-auto">{challenge.visibleTests.length} visible</span>
          </div>
          <div className="flex flex-col gap-2">
            {challenge.visibleTests.map((test, idx) => (
              <div key={idx} className="rounded-xl bg-zinc-800/40 border border-zinc-800/50 p-3">
                <div className="text-xs font-semibold text-zinc-300 mb-2">{test.name}</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                 <div className="flex flex-col gap-0.5 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/30">
                   <span className="text-[10px] text-zinc-500 uppercase font-semibold">Traffic</span>
                   <span className="text-[12px] font-mono text-zinc-300">{test.input.traffic} rps</span>
                 </div>
                 <div className="flex flex-col gap-0.5 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/30">
                   <span className="text-[10px] text-zinc-500 uppercase font-semibold">Max Latency</span>
                   <span className="text-[12px] font-mono text-zinc-300">{test.checks.maxLatency} ms</span>
                 </div>
                 <div className="flex flex-col gap-0.5 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/30">
                   <span className="text-[10px] text-zinc-500 uppercase font-semibold">Max Error</span>
                   <span className="text-[12px] font-mono text-zinc-300">{test.checks.maxErrorRate}%</span>
                 </div>
               </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
