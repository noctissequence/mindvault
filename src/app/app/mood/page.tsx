'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoodFace, MoonIcon } from '@/components/icons';

const MOOD_META: Record<string, { color: string; label: string }> = {
  happy: { color: '#34D399', label: 'Great' },
  okay: { color: '#FBBF24', label: 'Good' },
  neutral: { color: '#94A3B8', label: 'Neutral' },
  sad: { color: '#60A5FA', label: 'Sad' },
  anxiety: { color: '#C084FC', label: 'Anxious' },
  angry: { color: '#FB7185', label: 'Angry' }
};

interface MoodLog { id: string; mood: string; score: number; note: string | null; createdAt: string }

export default function MoodPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function load(range = days) {
    const token = localStorage.getItem('mv_token');
    const res = await fetch(`/api/mood?days=${range}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setLogs((await res.json()).logs);
    setLoading(false);
  }
  useEffect(() => { load(days); }, [days]);

  async function checkIn(mood: string) {
    setPicked(mood);
    const token = localStorage.getItem('mv_token');
    await fetch('/api/mood', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mood, note: note || undefined })
    });
    setNote('');
    load();
  }

  const byDay = logs.reduce<Record<string, MoodLog[]>>((acc, log) => {
    const key = new Date(log.createdAt).toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    (acc[key] = acc[key] || []).push(log);
    return acc;
  }, {});
  const dayEntries = Object.entries(byDay);
  const avg = logs.length ? logs.reduce((s, l) => s + l.score, 0) / logs.length : 0;
  const counts = logs.reduce<Record<string, number>>((acc, log) => { acc[log.mood] = (acc[log.mood] || 0) + 1; return acc; }, {});
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-300/60 mb-1.5">Mood</p>
        <h1 className="font-display text-[1.7rem] font-semibold heading-glow">Weather inside</h1>
        <p className="text-slate-500 text-[13px] mt-1.5">Feelings are data, not verdicts.</p>
      </div>

      <div className="glass p-6 md:p-7">
        <h2 className="text-[13px] font-medium text-slate-300 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-300/70" />
          Check in with yourself
        </h2>
        <div className="grid grid-cols-6 gap-2 md:gap-2.5">
          {Object.entries(MOOD_META).map(([key, meta], i) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => checkIn(key)}
              className={`glass-soft flex flex-col items-center gap-1.5 py-3.5 px-1 transition-all hover:-translate-y-1 ${picked === key ? '!border-indigo-300/40' : ''}`}
              style={{ ['--c' as string]: meta.color }}
              whileTap={{ scale: 0.93 }}
            >
              <span style={{ color: meta.color, opacity: picked === key ? 1 : 0.85 }}><MoodFace mood={key} size={28} active={picked === key} /></span>
              <span className="text-[10px] font-medium text-slate-500">{meta.label}</span>
            </motion.button>
          ))}
        </div>
        {picked && (
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[11.5px] text-emerald-300/90 mt-4 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
            Logged. Thank you for checking in.
          </motion.p>
        )}
      </div>

      <div className="flex gap-2">
        {[{ d: 7, l: 'Week' }, { d: 30, l: 'Month' }, { d: 90, l: '90 days' }].map(({ d, l }) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-[0.85rem] text-xs font-medium transition-all ${days === d ? 'bg-indigo-400/[0.14] text-indigo-200 border border-indigo-300/25' : 'glass-soft text-slate-500 hover:text-slate-300 border !border-transparent hover:!border-indigo-300/15'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><motion.div animate={{ opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 2.2 }} className="text-indigo-300/50"><MoonIcon size={30} /></motion.div></div>
      ) : logs.length === 0 ? (
        <div className="glass p-12 text-center">
          <div className="flex justify-center mb-4 text-indigo-300/50"><MoonIcon size={40} /></div>
          <p className="text-slate-400 text-sm leading-relaxed">No check-ins in this range yet.<br /><span className="text-slate-600">One tap above is all it takes.</span></p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-5 md:p-6">
              <p className="text-[11px] text-slate-500 mb-2 uppercase tracking-wider font-medium">Average feeling</p>
              <p className="font-display text-[1.7rem] font-semibold text-white leading-none">
                {avg.toFixed(1)}
                <span className="text-sm text-slate-500 font-normal"> / 5</span>
              </p>
              <div className="mt-3 h-[6px] bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(avg / 5) * 100}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400/70 to-emerald-400/80"
                />
              </div>
            </div>
            <div className="glass p-5 md:p-6">
              <p className="text-[11px] text-slate-500 mb-2 uppercase tracking-wider font-medium">Dominant</p>
              <div className="flex items-center gap-3">
                {dominant && (
                  <span style={{ color: MOOD_META[dominant[0]]?.color }}><MoodFace mood={dominant[0]} size={36} /></span>
                )}
                <span className="font-display text-lg font-semibold text-white">{dominant ? MOOD_META[dominant[0]]?.label : '—'}</span>
              </div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="text-[13px] font-medium text-slate-300 mb-5">Daily rhythm</h2>
            <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: 110 }}>
              {dayEntries.map(([day, dayLogs], i) => {
                const dayAvg = dayLogs.reduce((s, l) => s + l.score, 0) / dayLogs.length;
                const color = dayAvg >= 4 ? '#34D399' : dayAvg >= 3 ? '#FBBF24' : dayAvg >= 2 ? '#60A5FA' : '#C084FC';
                return (
                  <div key={day} className="flex flex-col items-center gap-2 shrink-0 group" title={`${day}: ${dayLogs.map(l => l.mood).join(', ')}`}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(8, (dayAvg / 5) * 78)}px` }}
                      transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className="w-7 rounded-[0.55rem] group-hover:brightness-125 transition-all"
                      style={{ background: `linear-gradient(180deg, ${color}, ${color}77)`, boxShadow: `0 0 14px ${color}33` }}
                    />
                    <span className="text-[9.5px] text-slate-600 font-medium">{day.split(' ')[1] || day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="text-[13px] font-medium text-slate-300 mb-4">History</h2>
            <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {[...logs].reverse().slice(0, 40).map(log => (
                <li key={log.id} className="flex items-center gap-3.5 text-[13px] py-1.5 border-b border-white/[0.03] last:border-0">
                  <span style={{ color: MOOD_META[log.mood]?.color }}><MoodFace mood={log.mood} size={22} /></span>
                  <span className="text-slate-300 w-16 font-medium">{MOOD_META[log.mood]?.label || log.mood}</span>
                  {log.note && <span className="text-slate-600 text-xs truncate flex-1">{log.note}</span>}
                  <span className="text-[11px] text-slate-600 ml-auto shrink-0 tabular-nums">
                    {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
