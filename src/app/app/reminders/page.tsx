'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function StarGlyph({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5L14.7 9.1L20.5 9.9L16.2 14L17.3 20L12 17L6.7 20L7.8 14L3.5 9.9L9.3 9.1L12 3.5Z" />
    </svg>
  );
}

interface Reminder { id: string; message: string; schedule: string; enabled: boolean; lastSentYMD: string | null }

export default function MoonGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
      <path d="M38 28.5C36.4 29.2 34.7 29.5 33 29.5C25.5 29.5 19.5 23.5 19.5 16C19.5 14 19.9 12.1 20.7 10.4C13.9 12 8.5 18.2 8.5 25.5C8.5 34 15.5 41 24 41C30.8 41 36.6 36.6 38.7 30.5C38.5 29.8 38.3 29.1 38 28.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M33 10.5L33.9 13.1L36.5 14L33.9 14.9L33 17.5L32.1 14.9L29.5 14L32.1 13.1L33 10.5Z" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
}

function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const token = localStorage.getItem('mv_token');
    const res = await fetch('/api/reminders', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setReminders((await res.json()).reminders);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setError('');
    if (!message.trim() || !schedule) return;
    setSaving(true);
    const token = localStorage.getItem('mv_token');
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ schedule, message })
    });
    if (!res.ok) setError((await res.json()).error || 'Failed');
    else { setSchedule(''); setMessage(''); load(); }
    setSaving(false);
  }

  async function toggle(reminder: Reminder) {
    const token = localStorage.getItem('mv_token');
    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: reminder.id, enabled: !reminder.enabled })
    });
    setReminders(prev => prev.map(r => (r.id === reminder.id ? { ...r, enabled: !r.enabled } : r)));
  }

  async function remove(id: string) {
    const token = localStorage.getItem('mv_token');
    await fetch(`/api/reminders?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  const custom = reminders;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-300/60 mb-1.5">Reminders</p>
        <h1 className="font-display text-[1.7rem] font-semibold heading-glow">Daily rituals</h1>
        <p className="text-slate-500 text-[13px] mt-1.5">Gentle nudges, delivered to your Telegram.</p>
      </div>

      {/* Built-in rituals */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-300/[0.07] blur-2xl" />
          <div className="text-amber-300/80 mb-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2.5V4.5M12 19.5V21.5M2.5 12H4.5M19.5 12H21.5M5 5L6.4 6.4M17.6 17.6L19 19M19 5L17.6 6.4M6.4 17.6L5 19" /></svg>
          </div>
          <h3 className="font-display font-medium text-slate-100">Morning check-in</h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1.5 mb-3">How do you feel · what matters today · what must not be forgotten</p>
          <p className="text-[11px] text-indigo-300/70">Arrives at your morning time — manage in Settings.</p>
        </div>
        <div className="glass p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-300/[0.08] blur-2xl" />
          <div className="text-indigo-300/80 mb-3"><MoonGlyph /></div>
          <h3 className="font-display font-medium text-slate-100">Night reflection</h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1.5 mb-3">What was heavy · what you accomplished · what you are grateful for</p>
          <p className="text-[11px] text-indigo-300/70">Arrives at your night time — manage in Settings.</p>
        </div>
      </div>

      <div className="glass p-6">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Add daily reminder</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="time"
            value={schedule}
            onChange={e => setSchedule(e.target.value)}
            className="input-calm sm:w-32"
          />
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="What should future-you remember?"
            className="input-calm flex-1"
            maxLength={500}
          />
          <button onClick={save} disabled={!schedule || !message.trim() || saving} className="btn-primary text-sm disabled:opacity-40 shrink-0">
            {saving ? 'Setting…' : 'Set reminder'}
          </button>
        </div>
        {error && <p className="text-xs text-rose-300 mt-2">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><motion.div animate={{ opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 2.2 }} className="text-indigo-300/50"><StarGlyph size={30} /></motion.div></div>
      ) : custom.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-slate-500">No custom reminders yet.</div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence>
            {custom.map((reminder, index) => (
              <motion.li
                key={reminder.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: index * 0.03 }}
                className="glass-soft p-4 flex items-center gap-4"
              >
                <span className="font-display font-semibold text-indigo-300 text-lg w-14 shrink-0">{reminder.schedule}</span>
                <span className={`text-sm flex-1 ${reminder.enabled ? 'text-slate-200' : 'text-slate-500 line-through'}`}>{reminder.message}</span>
                <button
                  onClick={() => toggle(reminder)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${reminder.enabled ? 'bg-emerald-400/70' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${reminder.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <button onClick={() => remove(reminder.id)} className="text-slate-600 hover:text-rose-300 text-xs shrink-0">✕</button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
