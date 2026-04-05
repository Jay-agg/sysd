'use client';

import { Play, Square } from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function ControlPanel() {
  const traffic = useSimulationStore((s) => s.traffic);
  const updateTraffic = useSimulationStore((s) => s.updateTraffic);
  const isRunning = useSimulationStore((s) => s.isRunning);
  const nodes = useSimulationStore((s) => s.nodes);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);

  const canRun = nodes.length > 0;

  const trafficPercent = (traffic / 10000) * 100;

  // Color based on traffic level
  const intensityColor =
    trafficPercent > 70 ? 'text-red-400' :
    trafficPercent > 40 ? 'text-amber-400' :
    trafficPercent > 0  ? 'text-emerald-400' :
    'text-zinc-500';

  return (
    <div className="flex flex-col gap-3">
      {/* ── Section Header ── */}
      <div className="flex items-center gap-2 px-1">
        <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Controls</span>
      </div>

      {/* ── Run / Stop ── */}
      <button
        type="button"
        disabled={!canRun && !isRunning}
        onClick={isRunning ? stopSimulation : startSimulation}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
          isRunning
            ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/25 hover:bg-red-500/15'
            : canRun
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99]'
              : 'cursor-not-allowed bg-zinc-800/80 text-zinc-500 ring-1 ring-zinc-700/60'
        }`}
        title={!canRun && !isRunning ? 'Add at least one node on the canvas' : undefined}
      >
        {isRunning ? (
          <>
            <Square size={14} fill="currentColor" />
            Stop simulation
          </>
        ) : (
          <>
            <Play size={14} fill="currentColor" className="text-white/90" />
            Run simulation
          </>
        )}
      </button>

      {/* ── Traffic Control Card ── */}
      <div className="rounded-2xl bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/60 p-4 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-zinc-400">Traffic Load</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
            isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {isRunning ? 'LIVE' : 'IDLE'}
          </span>
        </div>

        {/* Big number */}
        <div className="mb-4">
          <div className={`text-3xl font-bold font-mono tracking-tight transition-colors duration-300 ${intensityColor}`}>
            {traffic.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-500 font-medium">requests / second</span>
        </div>

        {/* Slider */}
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={10000}
            step={100}
            value={traffic}
            onChange={(e) => updateTraffic(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Scale markers */}
        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
          <span>0</span>
          <span>2.5k</span>
          <span>5k</span>
          <span>7.5k</span>
          <span>10k</span>
        </div>
      </div>

      {/* ── Status Card ── */}
      <div className="rounded-2xl bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/60 p-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
          <span className="text-xs font-medium text-zinc-400">System Status</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            !isRunning ? 'bg-zinc-600' :
            trafficPercent > 70 ? 'bg-red-400 animate-pulse' :
            trafficPercent > 40 ? 'bg-amber-400' :
            'bg-emerald-400'
          }`} />
          <span className="text-sm text-zinc-300">
            {!isRunning ? 'Simulation stopped' :
             trafficPercent > 70 ? 'System under heavy load' :
             trafficPercent > 40 ? 'Elevated traffic detected' :
             trafficPercent > 0  ? 'All systems nominal' :
             'Waiting for traffic...'}
          </span>
        </div>
      </div>
    </div>
  );
}
