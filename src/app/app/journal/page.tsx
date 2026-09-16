'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotebookIcon, MoonIcon } from '@/components/icons';

const MOOD_COLORS: Record<string, string> = {
  happy: '#34D399', okay: '#FBBF24', neutral: '#94A3B8', sad: '#60A5FA', anxiety: '#C084FC', angry: '#FB7185'
};

const CATEGORIES = ['all', 'note', 'braindump', 'memory', 'idea', 'promise', 'problem'];
const MOOD_FILTERS = ['all', 'happy', 'okay', 'sad', 'anxiety', 'angry'];

interface Entry {
  id: string;
  content: string;
  mood: string | null;
  category: string;
  tags: string;
  source: string;
  createdAt: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState('');
  const [category, setCategory] = useState('note');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMood, setFilterMood] = useState('all');
  const [saving, setSaving] = useState(false);

  async function load() {
    const token = localStorage.getItem('mv_token');
    const res = await fetch('/api/entries?limit=100', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setEntries((await res.json()).entries);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!composer.trim()) return;
    setSaving(true);
    const token = localStorage.getItem('mv_token');
    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: composer, category, source: 'web' })
    });
    setComposer('');
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    const token = localStorage.getItem('mv_token');
    await fetch(`/api/entries?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const filtered = useMemo(
    () => entries.filter(e =>
      (filterCategory === 'all' || e.category === filterCategory) &&
      (filterMood === 'all' || e.mood === filterMood)
    ),
    [entries, filterCategory, filterMood]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    for (const entry of filtered) {
      const key = new Date(entry.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      (groups[key] = groups[key] || []).push(entry);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-300/60 mb-1.5">Journal</p>
        <h1 className="font-display text-[1.7rem] font-semibold heading-glow">Let it out</h1>
        <p className="text-slate-500 text-[13px] mt-1.5">Everything you have taken off your mind.</p>
      </div>

      {/* Composer */}
      <div className="glass p-6">
        <textarea
          value={composer}
          onChange={e => setComposer(e.target.value)}
          placeholder="Write freely. No one is watching."
          rows={4}
          className="input-calm resize-none"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {CATEGORIES.slice(1).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${category === cat ? 'bg-indigo-400/20 text-indigo-200 border border-indigo-400/30' : 'text-slate-500 border border-transparent hover:text-slate-300'}`}
            >
              {cat}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={save} disabled={!composer.trim() || saving} className="btn-primary text-sm disabled:opacity-40">
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-calm !w-auto !py-2 text-xs">
          {CATEGORIES.map(cat => <option key={cat} value={cat}>type: {cat}</option>)}
        </select>
        <select value={filterMood} onChange={e => setFilterMood(e.target.value)} className="input-calm !w-auto !py-2 text-xs">
          {MOOD_FILTERS.map(mood => <option key={mood} value={mood}>mood: {mood}</option>)}
        </select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-16"><motion.div animate={{ opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 2.2 }} className="text-indigo-300/50"><MoonIcon size={30} /></motion.div></div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center">
          <div className="flex justify-center mb-4 text-indigo-300/50"><NotebookIcon size={40} /></div>
          <p className="text-slate-400 text-sm leading-relaxed">Nothing here yet.<br /><span className="text-slate-600">Your timeline is waiting for its first page.</span></p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayEntries]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-indigo-300/70 uppercase tracking-widest mb-3 sticky top-0 bg-transparent">{date}</h3>
              <div className="space-y-3 border-l border-indigo-400/10 ml-2 pl-5">
                <AnimatePresence>
                  {dayEntries.map((entry, index) => (
                    <motion.article
                      key={entry.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ delay: index * 0.03 }}
                      className="glass-soft p-4 group relative"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {entry.mood && <span className="w-2 h-2 rounded-full" style={{ background: MOOD_COLORS[entry.mood] }} />}
                          <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {entry.mood && <span style={{ color: MOOD_COLORS[entry.mood] }}>{entry.mood}</span>}
                          <span className="px-2 py-0.5 rounded-full bg-white/5">{entry.category}</span>
                          {entry.source !== 'web' && <span className="text-[10px] text-indigo-300/50 uppercase tracking-wide">{entry.source}</span>}
                        </div>
                        <button onClick={() => remove(entry.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-300 transition-all text-xs">delete</button>
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{entry.content}</p>
                      {entry.tags && (
                        <div className="flex gap-1.5 mt-2">
                          {entry.tags.split(',').filter(Boolean).map(tag => (
                            <span key={tag} className="text-[10px] text-indigo-300/70 bg-indigo-400/10 px-2 py-0.5 rounded-full">#{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
