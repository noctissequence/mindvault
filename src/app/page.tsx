'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MoonIcon, PlaneIcon } from '@/components/icons';

type Phase = 'loading' | 'setup' | 'login';

export default function LandingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [botUsername, setBotUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('mv_token');
    if (token) { router.replace('/app'); return; }
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => { setBotUsername(d.botUsername || ''); setPhase(d.exists ? 'login' : 'setup'); })
      .catch(() => setPhase('login'));
  }, [router]);

  async function createVault(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed'); setBusy(false); return; }
    setBotUsername(data.botUsername || botUsername);
    setPhase('login'); setBusy(false);
  }

  async function codeLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/auth', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed'); setBusy(false); return; }
    localStorage.setItem('mv_token', data.token);
    router.replace('/app');
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[26rem]"
      >
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-9">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.18, duration: 0.8, ease: [0.34, 1.4, 0.64, 1] }}
            className="floaty text-indigo-300 mb-5"
          >
            <MoonIcon size={52} />
          </motion.div>
          <h1 className="font-display text-[2rem] font-semibold heading-glow tracking-tight">MindVault</h1>
          <p className="text-slate-400/90 mt-2.5 text-sm text-center leading-relaxed max-w-[17rem]">
            A quiet room for your thoughts.<br />
            <span className="text-slate-500">Nothing here is judged.</span>
          </p>
        </div>

        <div className="glass p-7 md:p-8">
          {phase === 'loading' && (
            <div className="flex justify-center py-8">
              <motion.div animate={{ opacity: [0.25, 0.7, 0.25], rotate: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2.4 }} className="text-indigo-300/60">
                <MoonIcon size={30} />
              </motion.div>
            </div>
          )}

          {phase === 'setup' && (
            <motion.form onSubmit={createVault} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div>
                <h2 className="font-display text-lg font-semibold text-white mb-1">Make it yours</h2>
                <p className="text-xs text-slate-500 leading-relaxed">One name, then you are in. Your identity is your Telegram — no password to forget.</p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-2 uppercase tracking-wider">Your name</label>
                <input
                  className="input-calm"
                  placeholder="Your name or a nickname…"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  maxLength={60}
                  autoFocus
                />
              </div>
              {error && <p className="text-rose-300/90 text-[13px] bg-rose-500/[0.07] border border-rose-500/15 rounded-xl px-4 py-2.5">{error}</p>}
              <button type="submit" disabled={busy || !displayName.trim()} className="btn-primary w-full">
                {busy ? 'Preparing your room…' : 'Create my vault'}
              </button>
            </motion.form>
          )}

          {phase === 'login' && (
            <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {botUsername ? (
                <>
                  <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="btn-primary w-full !py-3.5 no-underline text-[0.95rem]">
                    <PlaneIcon size={17} />
                    Continue with Telegram
                  </a>
                  <p className="text-center text-[11px] text-slate-500 -mt-3">
                    Opens <span className="text-slate-400">@{botUsername}</span> — send /login there, it is instant.
                  </p>
                </>
              ) : (
                <p className="text-center text-xs text-slate-500">Bot not configured — use the code below.</p>
              )}
              <div className="flex items-center gap-3.5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300/20 to-transparent" />
                <span className="text-[10px] text-slate-600 uppercase tracking-[0.18em] font-medium">or with a code</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300/20 to-transparent" />
              </div>
              <form onSubmit={codeLogin} className="space-y-4">
                <input
                  className="input-calm text-center font-mono text-xl tracking-[0.45em] uppercase !py-3.5 placeholder:tracking-[0.45em]"
                  placeholder="······"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={8}
                  inputMode="text"
                  autoComplete="one-time-code"
                />
                {error && <p className="text-rose-300/90 text-[13px] bg-rose-500/[0.07] border border-rose-500/15 rounded-xl px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={busy || code.length < 4} className="btn-ghost w-full">
                  {busy ? 'Unlocking…' : 'Unlock'}
                </button>
              </form>
            </motion.div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6 flex items-center justify-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
          Self-hosted — your data stays on your server
        </p>
      </motion.div>
    </main>
  );
}
