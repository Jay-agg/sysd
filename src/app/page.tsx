'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Zap, BookOpen } from 'lucide-react';
import { challenges } from '@/lib/challenges';
import AppNavbar from '@/components/ui/AppNavbar';
import type { Difficulty } from '@/types/challenge';

const difficultyConfig: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy:   { label: 'Easy',   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  medium: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  hard:   { label: 'Hard',   color: 'text-red-400',     bg: 'bg-red-500/10' },
};

export default function QuestionBankPage() {
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredChallenges = challenges.filter(
    (c) => filter === 'all' || c.difficulty === filter
  );

  const totalPages = Math.ceil(filteredChallenges.length / ITEMS_PER_PAGE);
  const paginatedChallenges = filteredChallenges.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col h-screen bg-[#09090b] overflow-hidden">
      <AppNavbar />

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8 h-full overflow-hidden">
        {/* Header (Fixed) */}
        <div className="mb-6 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">System Design Challenges</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Challenge Bank</h1>
          <p className="text-zinc-500 text-[15px] leading-relaxed max-w-xl">
            Build real system architectures, test your designs, and learn why systems break under pressure.
          </p>
        </div>

        {/* Filters (Fixed) */}
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/80 pb-4 shrink-0">
          <button
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All Questions
          </button>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => { setFilter(d); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === d 
                  ? difficultyConfig[d].bg + ' ' + difficultyConfig[d].color 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {difficultyConfig[d].label}
            </button>
          ))}
          <div className="ml-auto text-xs text-zinc-500 font-semibold bg-zinc-800/40 px-3 py-1.5 rounded-lg">
            {filteredChallenges.length} Problems
          </div>
        </div>

        {/* Challenge list (Scrollable Box) */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4 flex flex-col gap-3 custom-scrollbar">
          {paginatedChallenges.map((challenge, i) => {
            const diff = difficultyConfig[challenge.difficulty];
            const originalIndex = challenges.indexOf(challenge);
            return (
              <Link
                key={challenge.id}
                href={`/challenge/${challenge.id}`}
                className="group relative flex items-center gap-5 p-5 rounded-2xl
                  bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/60
                  hover:bg-zinc-800/40 transition-all duration-300 shrink-0
                  shadow-lg shadow-black/10 hover:shadow-black/20"
              >
                {/* Number */}
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center
                  ring-1 ring-zinc-700/30 group-hover:ring-indigo-500/20 transition-all text-zinc-500 text-sm font-bold font-mono shrink-0">
                  {String(originalIndex + 1).padStart(2, '0')}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h2 className="text-[15px] font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                      {challenge.title}
                    </h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${diff.color} ${diff.bg}`}>
                      {diff.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {challenge.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="text-[10px] font-medium text-zinc-600 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                    {challenge.tags.length > 5 && (
                      <span className="text-[10px] font-medium text-zinc-600 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                        +{challenge.tags.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight
                  size={16}
                  className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0"
                />
              </Link>
            );
          })}
          
          {paginatedChallenges.length === 0 && (
            <div className="text-center py-10 text-zinc-500 text-sm">
              No problems found matching this filter.
            </div>
          )}
        </div>

        {/* Pagination & Stats footer (Fixed) */}
        <div className="shrink-0 mt-4 border-t border-zinc-800/80 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[12px] text-zinc-600">
            <div className="flex items-center gap-1.5">
              <Flame size={13} />
              <span>{challenges.length} challenges</span>
            </div>
            {/* <div className="flex items-center gap-1.5">
              <Zap size={13} />
              <span>{challenges.reduce((s, c) => s + c.visibleTests.length + c.hiddenTests.length, 0)} total tests</span>
            </div> */}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              <div className="text-xs font-mono text-zinc-500 font-semibold px-2">
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
