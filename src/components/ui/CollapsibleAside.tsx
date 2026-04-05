'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Side = 'left' | 'right';

export interface CollapsibleAsideProps {
  side: Side;
  /** Tailwind width when expanded, e.g. w-64, w-80, w-[340px] */
  expandedClassName: string;
  children: ReactNode;
  /** Accessible label for the toggle */
  label: string;
  /** Default open state */
  defaultOpen?: boolean;
}

const rail =
  'relative z-10 flex h-full shrink-0 flex-col overflow-visible border-zinc-800/60 bg-[#09090b] transition-[width] duration-200 ease-out';

const btnBase =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/90 text-zinc-400 shadow-sm backdrop-blur-sm hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 transition-colors';

export default function CollapsibleAside({
  side,
  expandedClassName,
  children,
  label,
  defaultOpen = true,
}: CollapsibleAsideProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const isLeft = side === 'left';
  const border = isLeft ? 'border-r' : 'border-l';
  const collapsedW = 'w-11';

  return (
    <div
      className={`relative ${rail} ${border} ${open ? expandedClassName : collapsedW}`}
    >
      {open ? (
        <>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
          <button
            type="button"
            onClick={toggle}
            className={`absolute top-1/2 z-20 -translate-y-1/2 ${btnBase} ${
              isLeft ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
            }`}
            aria-expanded={true}
            aria-label={`Collapse ${label}`}
            title={`Hide ${label}`}
          >
            {isLeft ? <ChevronLeft size={18} strokeWidth={2} /> : <ChevronRight size={18} strokeWidth={2} />}
          </button>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-3">
          <button
            type="button"
            onClick={toggle}
            className={`${btnBase} flex-col gap-0.5 px-0 py-2 h-auto w-9`}
            aria-expanded={false}
            aria-label={`Expand ${label}`}
            title={`Show ${label}`}
          >
            {isLeft ? <ChevronRight size={18} strokeWidth={2} /> : <ChevronLeft size={18} strokeWidth={2} />}
          </button>
        </div>
      )}
    </div>
  );
}
