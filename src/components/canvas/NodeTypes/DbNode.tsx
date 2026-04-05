'use client';

import { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import BaseSimNode, { type SimNodeData } from './BaseSimNode';
import { Database, Settings2 } from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';

function DbNode(props: NodeProps) {
  const data = props.data as SimNodeData;
  const updateNodeConfig = useSimulationStore((s) => s.updateNodeConfig);

  const [isExpanded, setIsExpanded] = useState(false);

  const replicas = data.config?.replicas ?? 1;
  const shards = data.config?.shards ?? 1;

  const handleUpdate = (updates: Partial<{ replicas: number; shards: number }>) => {
    updateNodeConfig(props.id, updates);
  };

  return (
    <div className="group relative">
      <BaseSimNode 
        {...props} 
        data={{ ...data, icon: <Database size={16} strokeWidth={1.8} /> }}
        actionContent={
          <button
            type="button"
            className={`p-[3px] rounded transition-colors nodrag nopan cursor-pointer z-50 ${
              isExpanded 
                ? 'text-zinc-200 bg-zinc-800' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
            }`}
            onClick={() => {
              setIsExpanded((prev) => !prev);
            }}
            title="Database Configuration"
          >
            <Settings2 size={14} />
          </button>
        }
      >
        {isExpanded && (
          <div className="px-3 pb-3 pt-3 border-t border-zinc-700/50 nodrag nopan bg-zinc-950/20 rounded-b-xl animate-in slide-in-from-top-1 fade-in duration-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Replicas</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{replicas}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={replicas}
                  onChange={(e) => handleUpdate({ replicas: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Shards</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{shards}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={shards}
                  onChange={(e) => handleUpdate({ shards: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </BaseSimNode>

      {/* Badges on the node card when collapsed */}
      {!isExpanded && (replicas > 1 || shards > 1) && (
        <div className="absolute -bottom-2 right-2 flex gap-1 pointer-events-none nodrag nopan z-[60]">
          {replicas > 1 && (
            <div className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 border border-zinc-700/50 shadow-sm backdrop-blur-sm">
              Rep: {replicas}
            </div>
          )}
          {shards > 1 && (
            <div className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 border border-zinc-700/50 shadow-sm backdrop-blur-sm">
              Sh: {shards}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(DbNode);
