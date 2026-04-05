'use client';

import { useCallback, useEffect, useMemo, useState, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  type Node,
  type Edge,
  type NodeTypes,
  type Connection,
  type OnNodesChange,
  type NodeChange,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSimulationStore } from '@/store/useSimulationStore';
import type { ComponentDef } from '@/types/simulation';

import ApiNode from './NodeTypes/ApiNode';
import AppServerNode from './NodeTypes/AppServerNode';
import DbNode from './NodeTypes/DbNode';
import CacheNode from './NodeTypes/CacheNode';
import GenericNode from './NodeTypes/GenericNode';

function CanvasZoomControls() {
  const { zoomIn, zoomOut } = useReactFlow();
  return (
    <Panel position="bottom-right" className="!mb-3 !mr-3">
      <div
        className="flex flex-col rounded-lg border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md shadow-lg shadow-black/30 overflow-hidden"
        role="group"
        aria-label="Canvas zoom"
      >
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomIn({ duration: 180 })}
          className="w-9 h-9 flex items-center justify-center text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
        >
          +
        </button>
        <div className="h-px bg-zinc-800/80" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomOut({ duration: 180 })}
          className="w-9 h-9 flex items-center justify-center text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
        >
          -
        </button>
      </div>
    </Panel>
  );
}

const nodeTypes: NodeTypes = {
  apiGateway:    ApiNode,
  appServer:     AppServerNode,
  database:      DbNode,
  cache:         CacheNode,
  loadBalancer:  GenericNode,
  webClient:     GenericNode,
  mobileClient:  GenericNode,
  worker:        GenericNode,
  queue:         GenericNode,
  sqlDatabase:   DbNode,
  noSqlDatabase: DbNode,
  cdn:           GenericNode,
  messageBroker: GenericNode,
};

export default function FlowCanvas() {
  const simNodes = useSimulationStore((s) => s.nodes);
  const simEdges = useSimulationStore((s) => s.edges);
  const isRunning = useSimulationStore((s) => s.isRunning);
  const traffic = useSimulationStore((s) => s.traffic);
  const addNode = useSimulationStore((s) => s.addNode);
  const addEdge = useSimulationStore((s) => s.addEdge);
  const removeNode = useSimulationStore((s) => s.removeNode);
  const updateNodePosition = useSimulationStore((s) => s.updateNodePosition);
  const scenarioName = useSimulationStore((s) => s.scenarioName);

  const { screenToFlowPosition } = useReactFlow();

  /** Selection is UI-only; sim ticks replace `nodes` without this field. */
  const [selectedById, setSelectedById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedById({});
  }, [scenarioName]);

  // Determine edge color based on system health
  const worstStatus = simNodes.reduce((worst, n) => {
    if (n.status === 'overloaded') return 'overloaded';
    if (n.status === 'stressed' && worst !== 'overloaded') return 'stressed';
    return worst;
  }, 'healthy' as 'healthy' | 'stressed' | 'overloaded');

  const edgeColor = !isRunning
    ? '#3f3f46'
    : worstStatus === 'overloaded'
      ? '#f87171'
      : worstStatus === 'stressed'
        ? '#fbbf24'
        : '#818cf8';

  const nodes: Node[] = useMemo(
    () =>
      simNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        draggable: true,
        data: {
          label: n.label,
          status: n.status,
          currentLoad: n.currentLoad,
          capacity: n.capacity,
          latency: n.latency,
          errorRate: n.errorRate,
          nodeType: n.type,
          config: n.config,
        },
        selectable: true,
        selected: selectedById[n.id] ?? false,
      })),
    [simNodes, selectedById]
  );

  const edges: Edge[] = useMemo(
    () =>
      simEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isRunning && traffic > 0,
        style: {
          stroke: edgeColor,
          strokeWidth: isRunning && traffic > 0 ? 2.5 : 1.5,
          transition: 'stroke 0.5s ease, stroke-width 0.3s ease',
        },
        selectable: false,
      })),
    [simEdges, isRunning, edgeColor, traffic]
  );

  // ── Drop handler ──
  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/flowsim-component');
      if (!raw) return;
      const item: ComponentDef = JSON.parse(raw);
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(item.type, item.label, position, item.defaultCapacity, item.defaultLatency);
    },
    [screenToFlowPosition, addNode]
  );

  // ── Connect handler ──
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection.source, connection.target);
      }
    },
    [addEdge]
  );

  // ── Node drag handler to persist position ──
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'select') {
          setSelectedById((prev) => ({ ...prev, [change.id]: change.selected }));
        } else if (change.type === 'remove') {
          removeNode(change.id);
          setSelectedById((prev) => {
            const next = { ...prev };
            delete next[change.id];
            return next;
          });
        } else if (change.type === 'position' && change.position && change.id) {
          updateNodePosition(change.id, change.position);
        }
      }
    },
    [updateNodePosition, removeNode]
  );

  return (
    <div
      className="w-full h-full bg-[#09090b]"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Avoid `fitView`: it refits when nodes change and zooms way in on sparse graphs, so dropped nodes look huge. */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        deleteKeyCode={['Backspace', 'Delete']}
        panOnDrag
        zoomOnScroll
        minZoom={0.25}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} color="#3f3f46" gap={20} size={1.5} />
        <CanvasZoomControls />
      </ReactFlow>
    </div>
  );
}
