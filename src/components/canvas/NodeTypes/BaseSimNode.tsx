'use client';

import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeStatus } from '@/types/simulation';

/* ── Status-based visual config ── */
const statusConfig: Record<NodeStatus, {
  border: string;
  bg: string;
  glow: string;
  bar: string;
  dot: string;
  ring: string;
}> = {
  healthy: {
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/[0.03]',
    glow: 'shadow-emerald-500/10',
    bar: 'bg-emerald-400',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-400/20',
  },
  stressed: {
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/[0.03]',
    glow: 'shadow-amber-500/10',
    bar: 'bg-amber-400',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/20',
  },
  overloaded: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/[0.04]',
    glow: 'shadow-red-500/15',
    bar: 'bg-red-400',
    dot: 'bg-red-400 animate-pulse',
    ring: 'ring-red-400/25',
  },
};

export interface SimNodeData {
  label: string;
  status: NodeStatus;
  currentLoad: number;
  capacity: number;
  latency: number;
  errorRate: number;
  icon: ReactNode;
  nodeType?: string;
  config?: Record<string, any>;
  [key: string]: unknown;
}

function BaseSimNode({ data, children, actionContent }: NodeProps & { data: SimNodeData; children?: ReactNode; actionContent?: ReactNode }) {
  const { label, status, currentLoad, capacity, latency, errorRate, icon } = data;
  const utilization = capacity > 0 ? Math.min((currentLoad / capacity) * 100, 100) : 0;
  const config = statusConfig[status];

  return (
    <div
      className={`
        relative rounded-xl border backdrop-blur-sm
        min-w-[168px] max-w-[220px] shadow-xl transition-all duration-500
        ${config.border} ${config.bg} ${config.glow}
        bg-zinc-900/80
      `}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-0 !rounded-full !-left-1"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-0 !rounded-full !-right-1"
      />

      {/* Top accent line */}
      <div className={`absolute top-0 left-3 right-3 h-px ${config.bar} opacity-40`} />

      {/* Content */}
      <div className="px-3 pt-3 pb-2.5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center ring-1 ring-zinc-700/40 text-zinc-400 [&_svg]:size-[14px]">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-zinc-200 truncate leading-tight">{label}</div>
            <div className="text-[9px] text-zinc-500 font-medium capitalize">{status}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ring-2 ${config.dot} ${config.ring}`} />
            {actionContent}
          </div>
        </div>

        {/* Utilization bar */}
        <div className="h-0.5 bg-zinc-800/60 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${config.bar}`}
            style={{ width: `${utilization}%` }}
          />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <MetricRow label="Load" value={`${currentLoad.toLocaleString()}`} unit="rps" />
          <MetricRow label="Capacity" value={`${capacity.toLocaleString()}`} unit="rps" />
          <MetricRow label="Latency" value={`${latency}`} unit="ms" />
          {errorRate > 0 && (
            <MetricRow
              label="Errors"
              value={`${Math.round(errorRate * 100)}`}
              unit="%"
              danger
            />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function MetricRow({
  label,
  value,
  unit,
  danger = false,
}: {
  label: string;
  value: string;
  unit: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`text-[9px] font-medium ${danger ? 'text-red-400/70' : 'text-zinc-500'}`}>
        {label}
      </span>
      <span className={`text-[10px] font-mono font-semibold ${danger ? 'text-red-400' : 'text-zinc-300'}`}>
        {value}
        <span className={`ml-0.5 text-[8px] font-normal ${danger ? 'text-red-500/60' : 'text-zinc-600'}`}>
          {unit}
        </span>
      </span>
    </div>
  );
}

export const MemoizedBaseSimNode = memo(BaseSimNode);
export default BaseSimNode;
