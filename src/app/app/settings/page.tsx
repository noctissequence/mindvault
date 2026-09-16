'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function GearGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8L13 5.2C13.7 5.4 14.3 5.6 14.9 6L17.3 4.9L19.1 6.7L18 9.1C18.4 9.7 18.6 10.3 18.8 11L21.2 12L18.8 13C18.6 13.7 18.4 14.3 18 14.9L19.1 17.3L17.3 19.1L14.9 18C14.3 18.4 13.7 18.6 13 18.8L12 21.2L11 18.8C10.3 18.6 9.7 18.4 9.1 18L6.7 19.1L4.9 17.3L6 14.9C5.6 14.3 5.4 13.7 5.2 13L2.8 12L5.2 11C5.4 10.3 5.6 9.7 6 9.1L4.9 6.7L6.7 4.9L9.1 6C9.7 5.6 10.3 5.4 11 5.2L12 2.8Z" />
    </svg>
  );
}

interface SettingsUser {
  email: string; displayName: string; timezone: string;
  telegramLinked: boolean; telegramUsername: string | null;
  morningReminder: boolean; nightReminder: boolean; morningTime: string; nightTime: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [linkInfo, setLinkInfo] = useState<{ linked: boolean; botUsername: string } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  function headers(): HeadersInit {
    return { 'content-type': 'application/json', Authorization: `Bearer ${localStorage.getItem('mv_token')}` };
  }

  useEffect(() => {
    fetch('/api/settings', { headers: headers() }).then(r => r.json()).then(d => d.user && setUser(d.user));
    fetch('/api/telegram/link', { headers: headers() }).then(r => r.json()).then(setLinkInfo).catch(() => null);
  }, []);

  async function save(patch: Record<string, unknown>) {
    const res = await fetch('/api/settings', { method: 'PATCH', headers: headers(), body: JSON.stringify(patch) });
    if (res.ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      const data = await res.json();
      if (data.displayName && user) setUser({ ...user, displayName: data.displayName });
    }
  }


  if (!user) return <div className="flex justify-center py-20"><motion.div animate={{ opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 2.2 }} className="text-indigo-300/50"><GearGlyph /></motion.div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-300/60 mb-1.5">Settings</p>
          <h1 className="font-display text-[1.7rem] font-semibold heading-glow">Your room</h1>
          <p className="text-slate-500 text-[13px] mt-1.5">Tune the quiet things.</p>
        </div>
        {savedFlash && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-emerald-300">✓ saved</motion.span>}
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Display name</label>
            <input
              defaultValue={user.displayName}
              onBlur={e => e.target.value !== user.displayName && save({ displayName: e.target.value })}
              className="input-calm"
              maxLength={60}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Timezone</label>
            <select
              value={user.timezone}
              onChange={e => { save({ timezone: e.target.value }); setUser({ ...user, timezone: e.target.value }); }}
              className="input-calm"
            >
              {['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'UTC'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-600">{user.email}</p>
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Daily rituals</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-soft p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-200 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2.5V4.5M12 19.5V21.5M2.5 12H4.5M19.5 12H21.5M5 5L6.4 6.4M17.6 17.6L19 19M19 5L17.6 6.4M6.4 17.6L5 19" /></svg>
                Morning check-in
              </span>
              <button
                onClick={() => { save({ morningReminder: !user.morningReminder }); setUser({ ...user, morningReminder: !user.morningReminder }); }}
                className={`relative w-10 h-5 rounded-full transition-colors ${user.morningReminder ? 'bg-emerald-400/70' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${user.morningReminder ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <input
              type="time" defaultValue={user.morningTime}
              onBlur={e => e.target.value !== user.morningTime && save({ morningTime: e.target.value })}
              className="input-calm !py-2"
            />
          </div>
          <div className="glass-soft p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-200 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5C18.9 15 17.7 15.3 16.5 15.3C10.7 15.3 6 10.6 6 4.8C6 3.2 6.4 1.7 7 0.4C2.9 1.7 0 5.5 0 10C0 15.5 4.5 20 10 20C14.5 20 18.3 17.1 19.7 13" transform="translate(2,2) scale(0.92)" /><path d="M17 2L17.6 3.8L19.4 4.4L17.6 5L17 6.8L16.4 5L14.6 4.4L16.4 3.8L17 2Z" fill="#A5B4FC" stroke="none" transform="translate(2,2) scale(0.92)" /></svg>
                Night reflection
              </span>
              <button
                onClick={() => { save({ nightReminder: !user.nightReminder }); setUser({ ...user, nightReminder: !user.nightReminder }); }}
                className={`relative w-10 h-5 rounded-full transition-colors ${user.nightReminder ? 'bg-emerald-400/70' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${user.nightReminder ? 'left-[22px]' : 'left-0.5'}`}
                />
              </button>
            </div>
            <input
              type="time" defaultValue={user.nightTime}
              onBlur={e => e.target.value !== user.nightTime && save({ nightTime: e.target.value })}
              className="input-calm !py-2"
            />
          </div>
        </div>
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Telegram</h2>
        {user.telegramLinked ? (
          <div className="glass-soft p-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-emerald-400/15 border border-emerald-300/25 flex items-center justify-center text-emerald-300 shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
            </span>
            <div>
              <p className="text-sm text-slate-200">Linked{user.telegramUsername ? ` as ${user.telegramUsername}` : ''}</p>
              <p className="text-xs text-slate-500">Quick capture, reminders, and web login codes all flow through here.</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-500 mb-3">
              Send <code className="text-indigo-300">/start</code> to the bot in Telegram — that links this vault instantly.
            </p>
            <a href={`https://t.me/${linkInfo?.botUsername || ''}`} target="_blank" rel="noreferrer" className="btn-ghost text-sm inline-block no-underline">
              ✈️ Open bot in Telegram
            </a>
          </div>
        )}
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Access</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          This vault has no password. You sign in with a code from your own Telegram
          (<code className="text-indigo-300">/login</code>) or the Mini App — whoever controls your
          Telegram controls the vault. Lost access = lost vault, so keep your Telegram safe.
        </p>
      </div>
    </div>
  );
}
