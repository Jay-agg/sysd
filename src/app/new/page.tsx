'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Save } from 'lucide-react';

import { useSimulationStore } from '@/store/useSimulationStore';

import AppNavbar from '@/components/ui/AppNavbar';
import CollapsibleAside from '@/components/ui/CollapsibleAside';
import ComponentLibrary from '@/components/ui/ComponentLibrary';
import ControlPanel from '@/components/ui/ControlPanel';
import FlowCanvas from '@/components/canvas/FlowCanvas';
import MetricsPanel from '@/components/ui/MetricsPanel';
import InsightPanel from '@/components/ui/InsightPanel';

export default function PlaygroundPage() {
  const loadScenario = useSimulationStore((s) => s.loadScenario);

  useEffect(() => {
    // Start with a clean canvas in playground mode
    loadScenario([], [], 'Playground');
  }, [loadScenario]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-[#09090b] overflow-hidden">
        <AppNavbar
          rightContent={
            <button
              onClick={() => alert('Save coming soon!')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold
                bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700
                transition-all cursor-pointer"
            >
              <Save size={14} />
              Save
            </button>
          }
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left — Component Library + Controls */}
          <CollapsibleAside side="left" expandedClassName="w-64" label="library and controls">
            <div className="flex-1 overflow-y-auto pt-2">
              <ComponentLibrary />
            </div>
            <div className="h-px bg-zinc-800/60 mx-3" />
            <div className="p-3 overflow-y-auto max-h-[45%]">
              <ControlPanel />
            </div>
          </CollapsibleAside>

          {/* Center — Canvas */}
          <main className="relative z-0 flex-1 min-w-0">
            <FlowCanvas />
          </main>

          {/* Right — Metrics + Insights */}
          <CollapsibleAside side="right" expandedClassName="w-80" label="metrics and insights">
            <div className="flex flex-col gap-3 p-3 overflow-y-auto">
              <MetricsPanel />
              <InsightPanel />
            </div>
          </CollapsibleAside>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
