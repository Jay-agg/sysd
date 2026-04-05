'use client';

import { useSimulationStore } from '@/store/useSimulationStore';

export default function Navbar() {
  const isRunning = useSimulationStore((s) => s.isRunning);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);
  const scenarioName = useSimulationStore((s) => s.scenarioName);

  return (
    <nav className="flex items-center justify-between px-5 py-3 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60 z-10">
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold text-white tracking-tight">FlowSim</span>
          <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Learn</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-700/60 mx-1" />

        {/* Scenario badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span className="text-xs font-medium text-zinc-300">{scenarioName}</span>
        </div>
      </div>

      {/* Right — CTA */}
      <button
        id="sim-toggle"
        onClick={isRunning ? stopSimulation : startSimulation}
        className={`group relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-250 cursor-pointer ${
          isRunning
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/15 ring-1 ring-red-500/20 hover:ring-red-500/30'
            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {isRunning ? (
          <>
            <span className="w-3 h-3 rounded-sm bg-red-400" />
            Stop
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Run Simulation
          </>
        )}
      </button>
    </nav>
  );
}
