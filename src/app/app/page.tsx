'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodFace, MoonIcon, FeatherIcon, SendIcon } from '@/components/icons';

const MOOD_OPTIONS = [
  { key: 'happy', label: 'Great', color: '#34D399' },
  { key: 'okay', label: 'Good', color: '#FBBF24' },
  { key: 'neutral', label: 'Okay', color: '#94A3B8' },
  { key: 'sad', label: 'Sad', color: '#60A5FA' },
  { key: 'anxiety', label: 'Anxious', color: '#C084FC' }
];

const MOOD_COLORS: Record<string, string> = {
  happy: '#34D399', okay: '#FBBF24', neutral: '#94A3B8', sad: '#60A5FA', anxiety: '#C084FC', angry: '#FB7185'
};

interface DashboardData {
  user: { displayName: string; timezone: string; telegramLinked: boolean };
  stats: { totalEntries: number; openMemories: number; moodLogs7d: number };
  latestEntries: { id: string; content: string; mood: string | null; category: string; createdAt: string }[];
  moodCounts: Record<string, number>;
  moodTrend: { mood: string; score: number; createdAt: string }[];
  pattern: string | null;
  wins: { id: string; content: string; createdAt: string }[];
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still awake';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [quickNote, setQuickNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [moodPicked, setMoodPicked] = useState<string | null>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem('mv_token');
    if (!token) return;
    fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(setData);
  }, []);

  useEffect(load, [load]);

  async function saveNote() {
    if (!quickNote.trim()) return;
    setSavingNote(true);
    const token = localStorage.getItem('mv_token');
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: quickNote, source: 'web' })
    });
    if (res.ok) {
      setQuickNote('');
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2600);
      load();
    }
    setSavingNote(false);
  }

  async function checkIn(mood: string) {
    setMoodPicked(mood);
    const token = localStorage.getItem('mv_token');
    await fetch('/api/mood', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mood })
    });
    load();
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[55dvh]">
        <motion.div animate={{ opacity: [0.25, 0.75, 0.25] }} transition={{ repeat: Infinity, duration: 2.2 }} className="text-indigo-300/60">
          <MoonIcon size={44} />
        </motion.div>
      </div>
    );
  }

  const maxCount = Math.max(1, ...Object.values(data.moodCounts));

  return (
    <div className="space-y-7">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-300/60 mb-1.5">{greeting()}</p>
        <h1 className="font-display text-[1.7rem] md:text-[2rem] font-semibold heading-glow leading-tight">
          Hi, {data.user.displayName}
        </h1>
        <p className="text-slate-500 mt-1.5 text-[13.5px]">This room is yours. Everything here is safe.</p>
      </motion.div>

      {/* Mood check-in */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}
        className="glass p-6 md:p-7"
      >
        <h2 className="text-[13px] font-medium text-slate-300 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-300/70" />
          How are you feeling right now?
        </h2>
        <AnimatePresence mode="wait">
          {moodPicked ? (
            <motion.div
              key="picked"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.34, 1.4, 0.64, 1] }}
              className="flex items-center gap-4"
            >
              <span style={{ color: MOOD_COLORS[moodPicked] }}><MoodFace mood={moodPicked} size={44} active /></span>
              <div>
                <p className="font-medium text-white text-[15px]">Noted — {MOOD_OPTIONS.find(m => m.key === moodPicked)?.label}.</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {moodPicked === 'happy' ? 'Hold onto this feeling today.' : 'Thanks for being honest. That takes strength.'}
                </p>
                <button onClick={() => setMoodPicked(null)} className="text-[11px] text-indigo-300/70 hover:text-indigo-200 mt-1.5 underline underline-offset-2">change</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-5 gap-2 md:gap-3 max-w-lg">
              {MOOD_OPTIONS.map((mood, i) => (
                <motion.button
                  key={mood.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => checkIn(mood.key)}
                  className="glass-soft flex flex-col items-center gap-1.5 py-3.5 px-1 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300/30 group"
                  whileTap={{ scale: 0.93 }}
                >
                  <span className="text-slate-400 group-hover:text-current transition-colors" style={{ ['--tw-text-opacity' as string]: '1' }}>
                    <span className="block [&>svg]:transition-colors" style={{ color: 'inherit' }}>
                      <span style={{ color: mood.color, opacity: 0.85 }}><MoodFace mood={mood.key} size={30} /></span>
                    </span>
                  </span>
                  <span className="text-[10.5px] font-medium text-slate-500 group-hover:text-slate-300">{mood.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Quick note */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.5 }}
        className="glass p-6 md:p-7"
      >
        <h2 className="text-[13px] font-medium text-slate-300 mb-4 flex items-center gap-2">
          <span className="text-indigo-300"><FeatherIcon size={16} /></span>
          Quick note
        </h2>
        <div className="relative">
          <textarea
            value={quickNote}
            onChange={e => setQuickNote(e.target.value)}
            placeholder="Whatever is on your mind…"
            rows={3}
            className="input-calm resize-none !pb-11"
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveNote(); }}
          />
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2.5">
            <AnimatePresence>
              {noteSaved && (
                <motion.span
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-emerald-300/90 flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                  saved
                </motion.span>
              )}
            </AnimatePresence>
            <button onClick={saveNote} disabled={!quickNote.trim() || savingNote} className="btn-primary !p-2.5 !rounded-xl disabled:!opacity-30">
              <SendIcon size={14} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Pattern insight */}
      {data.pattern && (
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
          className="glass p-6 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-400/70 via-violet-400/40 to-transparent" />
          <p className="text-[13.5px] text-slate-300 leading-relaxed pl-2">
            <span className="text-indigo-300 font-medium">Pattern — </span>{data.pattern.replace(/^(Your|Your) /, '')}
          </p>
        </motion.section>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Latest notes */}
        <motion.section
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.5 }}
          className="glass p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium text-slate-300">Latest thoughts</h2>
            <span className="text-[11px] text-slate-600">{data.stats.totalEntries} total</span>
          </div>
          {data.latestEntries.length === 0 ? (
            <p className="text-[13px] text-slate-500 leading-relaxed">No notes yet. The first line is the hardest — after that it flows.</p>
          ) : (
            <ul className="space-y-3">
              {data.latestEntries.map((entry, i) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="glass-soft p-4 group hover:border-indigo-300/20 transition-colors"
                >
                  <p className="text-[13px] text-slate-200 leading-relaxed line-clamp-2">{entry.content}</p>
                  <div className="flex items-center gap-2.5 mt-2.5 text-[11px] text-slate-500">
                    {entry.mood && <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: MOOD_COLORS[entry.mood], boxShadow: `0 0 8px ${MOOD_COLORS[entry.mood]}55` }} />}
                    <span>{new Date(entry.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-slate-600">{entry.category}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>

        <div className="space-y-6">
          {/* Small wins */}
          <motion.section
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.5 }}
            className="glass p-6"
          >
            <h2 className="text-[13px] font-medium text-slate-300 mb-3.5">Small wins</h2>
            {data.wins.length === 0 ? (
              <p className="text-[13px] text-slate-500 leading-relaxed">Any win counts — ate, showered, survived. They land here.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.wins.map(win => (
                  <li key={win.id} className="flex items-start gap-2.5 text-[13px] text-slate-200">
                    <span className="text-emerald-400/90 mt-[3px] shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                    </span>
                    <span className="line-clamp-1">{win.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* Mood chart */}
          <motion.section
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="glass p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-medium text-slate-300">Mood · last 7 days</h2>
              <span className="text-[11px] text-slate-600">{data.stats.moodLogs7d} check-ins</span>
            </div>
            {Object.keys(data.moodCounts).length === 0 ? (
              <p className="text-[13px] text-slate-500">No check-ins yet this week.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count], i) => (
                  <div key={mood} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 w-14 capitalize">{mood}</span>
                    <div className="flex-1 h-[7px] bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxCount) * 100}%` }}
                        transition={{ duration: 0.9, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${MOOD_COLORS[mood]}99, ${MOOD_COLORS[mood]})`, boxShadow: `0 0 12px ${MOOD_COLORS[mood]}44` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 w-6 text-right tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
