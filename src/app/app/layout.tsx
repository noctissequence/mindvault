'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HomeIcon, NotebookIcon, BrainIcon, StarIcon, GearIcon, MoonIcon } from '@/components/icons';

const NAV = [
  { href: '/app', label: 'Home', Icon: HomeIcon },
  { href: '/app/journal', label: 'Journal', Icon: NotebookIcon },
  { href: '/app/mood', label: 'Mood', Icon: null }, // special: mood face
  { href: '/app/memories', label: 'Memories', Icon: BrainIcon },
  { href: '/app/reminders', label: 'Rituals', Icon: StarIcon },
  { href: '/app/settings', label: 'Settings', Icon: GearIcon }
];

function NavIcon({ item, active, size }: { item: (typeof NAV)[number]; active: boolean; size: number }) {
  if (item.href === '/app/mood') {
    // serene face for the mood tab
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" />
        <circle cx="17" cy="18" r="1.4" fill="currentColor" />
        <circle cx="31" cy="18" r="1.4" fill="currentColor" />
        <path d="M16.5 29C18 31.5 20.8 33 24 33C27.2 33 30 31.5 31.5 29" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" />
      </svg>
    );
  }
  const Icon = item.Icon!;
  return <Icon size={size} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [initial, setInitial] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('mv_token');
    if (!token) { router.replace('/'); return; }
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) { router.replace('/'); return; }
        setUserName(data.user.displayName);
        setInitial(data.user.displayName?.[0]?.toUpperCase() || '·');
      })
      .catch(() => router.replace('/'));
  }, [router]);

  function signOut() {
    localStorage.removeItem('mv_token');
    router.replace('/');
  }

  return (
    <div className="min-h-dvh flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-indigo-200/[0.07] px-5 py-9 sticky top-0 h-dvh">
        <Link href="/app" className="flex items-center gap-3 px-3 mb-10 group">
          <span className="text-indigo-300 group-hover:text-indigo-200 transition-colors"><MoonIcon size={30} /></span>
          <span className="font-display font-semibold text-[1.05rem] heading-glow">MindVault</span>
        </Link>
        <nav className="space-y-1.5 flex-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3.5 px-4 py-2.5 rounded-[0.9rem] text-[13.5px] font-medium transition-all duration-200 ${
                  active
                    ? 'text-white bg-gradient-to-r from-indigo-400/[0.16] to-indigo-400/[0.04] border border-indigo-300/20'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.035] border border-transparent'
                }`}
              >
                {active && (
                  <motion.span layoutId="nav-dot" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-indigo-300" />
                )}
                <span className={active ? 'text-indigo-300' : ''}><NavIcon item={{ href, label, Icon }} active={active} size={19} /></span>
                {label}
              </Link>
            );
          })}
        </nav>
        {userName && (
          <div className="glass-soft p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400/70 to-violet-500/60 flex items-center justify-center text-white font-display font-semibold text-sm shadow-glow">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-slate-200 font-medium truncate">{userName}</p>
              <button onClick={signOut} className="text-[11px] text-slate-500 hover:text-indigo-300 transition-colors">Sign out</button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden flex items-center justify-between px-5 pt-5 pb-1">
          <span className="font-display font-semibold text-lg heading-glow">MindVault</span>
          <button onClick={signOut} className="text-[11px] text-slate-500 hover:text-slate-300">Sign out</button>
        </header>
        <main className="flex-1 px-4 md:px-10 py-5 md:py-10 pb-28 md:pb-10 max-w-3xl w-full mx-auto">{children}</main>
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-4 pointer-events-none">
          <div className="glass !rounded-[1.4rem] mx-auto max-w-md flex justify-around px-2 py-2.5 pointer-events-auto" style={{ borderRadius: '1.4rem' }}>
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className="relative flex flex-col items-center gap-1 px-2 py-1 rounded-xl min-w-[3.2rem]">
                  {active && (
                    <motion.span layoutId="mobile-nav-pill" className="absolute inset-0 rounded-xl bg-indigo-400/[0.14] border border-indigo-300/20" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                  )}
                  <span className={`relative z-10 transition-colors ${active ? 'text-indigo-300' : 'text-slate-500'}`}>
                    <NavIcon item={{ href, label, Icon }} active={active} size={20} />
                  </span>
                  <span className={`relative z-10 text-[9px] font-medium transition-colors ${active ? 'text-indigo-200' : 'text-slate-600'}`}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
