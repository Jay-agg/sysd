'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, BookOpen, Layers } from 'lucide-react';

interface AppNavbarProps {
  rightContent?: React.ReactNode;
}

export default function AppNavbar({ rightContent }: AppNavbarProps) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Challenges', href: '/', icon: BookOpen },
    { label: 'Playground', href: '/new', icon: Layers },
  ];

  return (
    <nav className="flex items-center justify-between px-5 py-2.5 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60 z-10 shrink-0">
      {/* Left — Brand + Tabs */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div> */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-semibold text-white tracking-tight">Scalab</span>
          </div>
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-700/60" />

        {/* Nav Tabs */}
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => {
            const isActive = tab.href === '/'
              ? pathname === '/' || pathname.startsWith('/challenge')
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-800/60 text-white'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                <Icon size={14} strokeWidth={1.8} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right — Page-specific actions */}
      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </nav>
  );
}
