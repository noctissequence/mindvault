'use client';

// Telegram Mini App — speed-first capture. Token from initData once, everything inline.
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodFace, MoonIcon, NotebookIcon, BrainIcon, StarIcon, SendIcon, FeatherIcon } from '@/components/icons';

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void; HapticFeedback?: { impactOccurred: (s: string) => void } } };
  }
}

const MOODS = [
  { key: 'happy', label: 'Great' },
  { key: 'okay', label: 'Okay' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'sad', label: 'Sad' },
  { key: 'anxiety', label: 'Anxious' }
];

type View = 'home' | 'note' | 'mood' | 'remind' | 'memory';

export default function MiniApp() {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [view, setView] = useState<View>('home');
  const [text, setText] = useState('');
  const [extra, setExtra] = useState('');
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<{ id: string; content: string; mood: string | null; createdAt: string }[]>([]);
  const [pendingClaim, setPendingClaim] = useState('');

  const haptic = () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed');
    return data;
  }, [token]);

  const showFlash = (message: string) => {
    setFlash(message);
    setTimeout(() => setFlash(''), 2200);
  };

  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    wa?.ready();
    wa?.expand();
    const initData = wa?.initData || new URLSearchParams(location.search).get('tgWebAppData') || '';
    if (!initData) { setError('Open this from the bot chat: tap the menu button or send /start.'); return; }
    fetch('/api/telegram/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData })
    })
      .then(async res => {
        const data = await res.json();
        if (res.status === 202 && data.pendingLink) { setPendingClaim(data.claimToken); return; }
        if (!res.ok) throw new Error(data.error);
        setToken(data.token);
        setName(data.user.displayName);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!pendingClaim) return;
    const timer = setInterval(async () => {
      const initData = window.Telegram?.WebApp?.initData || new URLSearchParams(location.search).get('tgWebAppData') || '';
      const res = await fetch('/api/telegram/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ initData })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        clearInterval(timer);
        setPendingClaim('');
        setToken(data.token);
        setName(data.user.displayName);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [pendingClaim]);

  useEffect(() => {
    if (!token) return;
    api('/api/entries?limit=5').then(d => setRecent(d.entries)).catch(() => null);
  }, [token, api]);

  async function submitNote() {
    if (!text.trim()) return;
    haptic();
    try {
      await api('/api/entries', { method: 'POST', body: JSON.stringify({ content: text, source: 'miniapp' }) });
      setText('');
      showFlash('Saved safely');
      const d = await api('/api/entries?limit=5');
      setRecent(d.entries);
      setView('home');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }

  async function submitMood(mood: string) {
    haptic();
    try {
      await api('/api/mood', { method: 'POST', body: JSON.stringify({ mood }) });
      showFlash('Logged');
      setView('home');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }

  async function submitReminder() {
    haptic();
    try {
      const schedule = (text.match(/^([01]\d|2[0-3]):[0-5]\d/)?.[0]) || extra;
      const message = text.replace(/^([01]\d|2[0-3]):[0-5]\d\s*/, '').trim();
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule || '') || !message) {
        setError('Format: HH:MM + message');
        return;
      }
      await api('/api/reminders', { method: 'POST', body: JSON.stringify({ schedule, message }) });
      setText(''); setExtra('');
      showFlash('Reminder set');
      setView('home');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }

  async function submitMemory() {
    if (!text.trim()) return;
    haptic();
    try {
      const [title, ...rest] = text.split('|');
      await api('/api/memories', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), description: rest.join('|').trim() })
      });
      setText('');
      showFlash('Kept in vault');
      setView('home');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }

  if (error && !token) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass p-8 max-w-sm">
          <div className="flex justify-center mb-4 text-indigo-300/60"><MoonIcon size={40} /></div>
          <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
        </motion.div>
      </main>
    );
  }

  if (pendingClaim && !token) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass p-8 max-w-sm">
          <motion.div
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3.2 }}
            className="flex justify-center mb-4 text-indigo-300"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 14L14 10M9 12L7.5 13.5C6 15 6 17.5 7.5 19C9 20.5 11.5 20.5 13 19L14.5 17.5M13.5 12L15 10.5C16.5 9 16.5 6.5 15 5C13.5 3.5 11 3.5 9.5 5L8 6.5" /></svg>
          </motion.div>
          <h1 className="font-display text-lg font-semibold text-white mb-2">One last step</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Send <code className="text-indigo-300 px-1.5 py-0.5 rounded-md bg-indigo-400/10">/start</code> to your diary bot in this chat —
            that claims this vault as yours. This screen unlocks by itself.
          </p>
        </motion.div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <motion.div animate={{ opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 2.2 }} className="text-indigo-300/50"><MoonIcon size={44} /></motion.div>
      </main>
    );
  }

  const ACTIONS: { key: View; label: string; sub: string; icon: React.ReactNode }[] = [
    { key: 'note', label: 'Write note', sub: 'dump a thought', icon: <NotebookIcon size={22} /> },
    { key: 'mood', label: 'Check mood', sub: 'how you feel', icon: <MoodFace mood="happy" size={24} /> },
    { key: 'remind', label: 'Reminder', sub: 'daily nudge', icon: <StarIcon size={22} /> },
    { key: 'memory', label: 'Memory', sub: 'keep it safe', icon: <BrainIcon size={22} /> }
  ];

  return (
    <main className="min-h-dvh px-4 py-7 pb-20 max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-indigo-300/60 mb-1">MindVault</p>
            <h1 className="font-display text-[1.45rem] font-semibold heading-glow">Hello, {name}</h1>
            <p className="text-slate-500 text-xs mt-1 mb-6">Your quiet room, always in your pocket.</p>

            <div className="grid grid-cols-2 gap-3">
              {ACTIONS.map((action, i) => (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { haptic(); setView(action.key); }}
                  className="glass p-5 text-left active:scale-[0.96] transition-transform group"
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="text-indigo-300/90 inline-block mb-2.5 group-hover:text-indigo-200 transition-colors">{action.icon}</span>
                  <p className="text-[13.5px] text-slate-100 font-medium">{action.label}</p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">{action.sub}</p>
                </motion.button>
              ))}
            </div>

            {recent.length > 0 && (
              <div className="mt-7">
                <h2 className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-2.5 px-1">Recent</h2>
                <ul className="space-y-2">
                  {recent.map((entry, i) => (
                    <motion.li key={entry.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="glass-soft p-3.5">
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{entry.content}</p>
                      <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1.5">
                        {entry.mood && <span className="w-[6px] h-[6px] rounded-full" style={{ background: entry.mood === 'happy' ? '#34D399' : entry.mood === 'anxiety' ? '#C084FC' : '#60A5FA' }} />}
                        {new Date(entry.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {view === 'note' && (
          <motion.div key="note" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="text-indigo-300/80 mb-3"><FeatherIcon size={22} /></div>
            <h1 className="font-display text-lg font-semibold text-white mb-1">What is on your mind?</h1>
            <p className="text-xs text-slate-500 mb-4">Write anything. It is safe here.</p>
            <textarea
              value={text} onChange={e => setText(e.target.value)} rows={6} autoFocus
              placeholder="Dump it…"
              className="input-calm resize-none"
            />
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setView('home')} className="btn-ghost flex-1 !py-3 text-sm">Back</button>
              <button onClick={submitNote} disabled={!text.trim()} className="btn-primary flex-1 !py-3 text-sm">
                <SendIcon size={14} /> Save
              </button>
            </div>
          </motion.div>
        )}

        {view === 'mood' && (
          <motion.div key="mood" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <h1 className="font-display text-lg font-semibold text-white mb-1">How are you feeling?</h1>
            <p className="text-xs text-slate-500 mb-5">One tap. No wrong answers.</p>
            <div className="space-y-2.5">
              {MOODS.map((mood, i) => (
                <motion.button
                  key={mood.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => submitMood(mood.key)}
                  className="glass w-full p-4 flex items-center gap-3.5 text-left active:scale-[0.98] transition-transform"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-indigo-300/90"><MoodFace mood={mood.key} size={26} /></span>
                  <span className="text-sm text-slate-200 font-medium">{mood.label}</span>
                </motion.button>
              ))}
            </div>
            <button onClick={() => setView('home')} className="btn-ghost w-full mt-4 !py-3 text-sm">Back</button>
          </motion.div>
        )}

        {view === 'remind' && (
          <motion.div key="remind" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="text-amber-300/80 mb-3"><StarIcon size={22} /></div>
            <h1 className="font-display text-lg font-semibold text-white mb-1">New reminder</h1>
            <p className="text-xs text-slate-500 mb-4">Start with HH:MM, then the message.</p>
            <textarea
              value={text} onChange={e => setText(e.target.value)} rows={3} autoFocus
              placeholder="21:00 journal before sleep"
              className="input-calm resize-none"
            />
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setView('home')} className="btn-ghost flex-1 !py-3 text-sm">Back</button>
              <button onClick={submitReminder} disabled={!text.trim()} className="btn-primary flex-1 !py-3 text-sm">Set</button>
            </div>
          </motion.div>
        )}

        {view === 'memory' && (
          <motion.div key="memory" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="text-indigo-300/80 mb-3"><BrainIcon size={22} /></div>
            <h1 className="font-display text-lg font-semibold text-white mb-1">Keep a memory</h1>
            <p className="text-xs text-slate-500 mb-4">Title first, details after a |</p>
            <textarea
              value={text} onChange={e => setText(e.target.value)} rows={4} autoFocus
              placeholder="Talk to mom Sunday | she asked twice"
              className="input-calm resize-none"
            />
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setView('home')} className="btn-ghost flex-1 !py-3 text-sm">Back</button>
              <button onClick={submitMemory} disabled={!text.trim()} className="btn-primary flex-1 !py-3 text-sm">Keep</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-7 inset-x-0 mx-auto w-fit glass px-5 py-2.5 text-[13px] text-emerald-300 z-50 flex items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
            {flash}
          </motion.div>
        )}
      </AnimatePresence>
      {error && token && <p className="text-[11px] text-rose-300/90 mt-3 text-center">{error}</p>}
    </main>
  );
}
