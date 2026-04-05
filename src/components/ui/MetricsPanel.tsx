'use client';

import { useSimulationStore } from '@/store/useSimulationStore';

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
}

function MetricCard({ label, value, unit, color, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl bg-zinc-800/40 border border-zinc-800/60 p-3.5 transition-all duration-300 hover:bg-zinc-800/60">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono tracking-tight transition-colors duration-300 ${color}`}>
          {value}
        </span>
        <span className="text-[11px] text-zinc-600 font-medium">{unit}</span>
      </div>
    </div>
  );
}

export default function MetricsPanel() {
  const metrics = useSimulationStore((s) => s.metrics);
  const isRunning = useSimulationStore((s) => s.isRunning);

  const latencyColor =
    metrics.avgLatency > 200 ? 'text-red-400' :
    metrics.avgLatency > 50  ? 'text-amber-400' :
    'text-emerald-400';

  const errorColor =
    metrics.errorPercent > 20 ? 'text-red-400' :
    metrics.errorPercent > 5  ? 'text-amber-400' :
    'text-emerald-400';

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-1">
        <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Metrics</span>
      </div>

      {/* Metrics Container */}
      <div className="rounded-2xl bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/60 p-3 shadow-lg shadow-black/20">
        {!isRunning && metrics.totalRequests === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <p className="text-xs text-zinc-600 max-w-[160px]">Run a simulation to see real-time metrics</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 stagger-children">
            <MetricCard
              label="Throughput"
              value={metrics.totalRequests.toLocaleString()}
              unit="rps"
              color="text-indigo-400"
              icon={
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
              }
            />
            <MetricCard
              label="Avg Latency"
              value={metrics.avgLatency.toString()}
              unit="ms"
              color={latencyColor}
              icon={
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              }
            />
            <MetricCard
              label="Error Rate"
              value={metrics.errorPercent.toString()}
              unit="%"
              color={errorColor}
              icon={
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
