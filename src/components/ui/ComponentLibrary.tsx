'use client';

import { useState, DragEvent } from 'react';
import { GripVertical } from 'lucide-react';
import { componentLibrary, type ComponentCategory } from '@/lib/componentLibrary';
import { nodeIconMap, categoryIcons } from '@/lib/icons';
import type { ComponentDef, SimNodeType } from '@/types/simulation';

function CategorySection({ category }: { category: ComponentCategory }) {
  const [isOpen, setIsOpen] = useState(true);
  const CategoryIcon = categoryIcons[category.name as keyof typeof categoryIcons];

  return (
    <div className="mb-1">
      {/* Category header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left hover:bg-zinc-800/40 transition-colors cursor-pointer group"
      >
        {CategoryIcon && <CategoryIcon size={12} className="text-zinc-500" strokeWidth={2} />}
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex-1">
          {category.name}
        </span>
        <svg
          className={`w-3 h-3 text-zinc-600 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {/* Items */}
      {isOpen && (
        <div className="mt-1 flex flex-col gap-0.5 animate-fade-in-up">
          {category.items.map((item, i) => (
            <DraggableComponent key={`${category.name}-${item.label}-${i}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableComponent({ item }: { item: ComponentDef }) {
  const IconComponent = nodeIconMap[item.type as SimNodeType];

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/flowsim-component', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing
        bg-transparent hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/40
        transition-all duration-200 group select-none"
    >
      <div className="w-7 h-7 rounded-lg bg-zinc-800/60 flex items-center justify-center
        ring-1 ring-zinc-700/30 group-hover:ring-zinc-600/40 transition-all shrink-0 text-zinc-400 group-hover:text-zinc-300">
        {IconComponent && <IconComponent size={14} strokeWidth={1.8} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-zinc-300 group-hover:text-zinc-200 truncate transition-colors">
          {item.label}
        </div>
        <div className="text-[10px] text-zinc-600 font-mono">
          {item.defaultCapacity >= 99999 ? '∞' : `${(item.defaultCapacity / 1000).toFixed(0)}k`} rps · {item.defaultLatency}ms
        </div>
      </div>
      <GripVertical size={14} className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
    </div>
  );
}

export default function ComponentLibrary() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-1 pb-2">
        <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Components</span>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-3">
        {componentLibrary.map((cat) => (
          <CategorySection key={cat.name} category={cat} />
        ))}
      </div>

      {/* Hint */}
      <div className="px-3 py-2.5 border-t border-zinc-800/50">
        <p className="text-[10px] text-zinc-600 leading-relaxed text-center">
          Drag components onto the canvas to build your system
        </p>
      </div>
    </div>
  );
}
