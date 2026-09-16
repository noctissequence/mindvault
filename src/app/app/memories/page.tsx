'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainIcon } from '@/components/icons';

const TYPES = [
  { key: 'important', label: 'Important', color: '#FBBF24' },
  { key: 'promise', label: 'Promise', color: '#34D399' },
  { key: 'idea', label: 'Idea', color: '#818CF8' },
  { key: 'problem', label: 'Problem', color: '#FB7185' }
];

function TypeGlyph({ type, size = 13 }: { type: string; size?: number }) {
  const paths: Record<string, JSX.Element> = {
    important: <path d="M12 3L12 14M12 18.5V19.5" strokeLinecap="round" strokeWidth="2.4" />,
    promise: <path d="M8 12.5C8 9 10.5 7 12 7C13.5 7 16 9 16 12.5C16 15.5 14 17.5 12 19C10 17.5 8 15.5 8 12.5Z" strokeLinejoin="round" />,
    idea: <><path d="M12 3.5C9 3.5 6.8 5.9 6.8 8.7C6.8 10.9 8 12.2 8.8 13.4C9.3 14.2 9.5 15 9.5 16H14.5C14.5 15 14.7 14.2 15.2 13.4C16 12.2 17.2 10.9 17.2 8.7C17.2 5.9 15 3.5 12 3.5Z" strokeLinejoin="round" /><path d="M10 19H14" strokeLinecap="round" /></>,
    problem: <><circle cx="12" cy="12" r="3" /><path d="M12 5.5C15 5.5 17 7 18.5 9M18.5 15C17 17 15 18.5 12 18.5C9 18.5 7 17 5.5 15" strokeLinecap="round" strokeDasharray="0.1 3.2" /></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[type]}
    </svg>
  );
}

interface Memory { id: string; title: string; description: string; type: string; status: string; createdAt: string }

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('important');
  const [saving, setSaving] = useState(false);

  async function load() {
    const token = localStorage.getItem('mv_token');
    const res = await fetch('/api/memories', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMemories((await res.json()).memories);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    const token = localStorage.getItem('mv_token');
    await fetch('/api/memories', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description, type })
    });
    setTitle(''); setDescription('');
    setSaving(false);
    load();
  }

  async function setStatus(id: string, status: string) {
    const token = localStorage.getItem('mv_token');
    await fetch('/api/memories', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status })
    });
    setMemories(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
  }

  async function remove(id: string) {
    const token = localStorage.getItem('mv_token');
    await fetch(`/api/memories?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setMemories(prev => prev.filter(m => m.id !== id));
  }

  const filtered = typeFilter === 'all' ? memories : memories.filter(m => m.type === typeFilter);
  const typeMeta = (key: string) => TYPES.find(t => t.key === key) ?? TYPES[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-indigo-300/60 mb-1.5">Memories</p>
        <h1 className="font-display text-[1.7rem] font-semibold heading-glow">The vault</h1>
        <p className="text-slate-500 text-[13px] mt-1.5">Worth keeping — so your head does not have to hold them all.</p>
      </div>

      <div className="glass p-6 space-y-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title — keep it short" className="input-calm" maxLength={200} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details (optional)…" className="input-calm resize-none" rows={2} maxLength={2000} />
        <div className="flex flex-wrap items-center gap-2">
          {TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${type === t.key ? 'bg-white/10 border' : 'border border-transparent text-slate-500 hover:text-slate-300'}`}
              style={type === t.key ? { borderColor: `${t.color}66`, color: t.color } : {}}
            >
              <TypeGlyph type={t.key} size={11} /> {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={save} disabled={!title.trim() || saving} className="btn-primary text-sm disabled:opacity-40">{saving ? 'Keeping…' : 'Keep it'}</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ key: 'all', label: 'All' }, ...TYPES].map(t => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs transition-all ${typeFilter === t.key ? 'bg-indigo-400/20 text-indigo-200 border border-indigo-400/30' : 'glass-soft text-slate-500'}`}
          >
            <TypeGlyph type={t.key} size={11} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><motion.div animate={{ opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 2.2 }} className="text-indigo-300/50"><BrainIcon size={30} /></motion.div></div>
      ) : filtered.length === 0 ? (
        <div className="glass p-10 text-center">
          <div className="flex justify-center mb-4 text-indigo-300/50"><BrainIcon size={40} /></div>
          <p className="text-slate-400 text-sm">The vault is empty. Drop something in — a promise, an idea, a worry.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((memory, index) => {
              const meta = typeMeta(memory.type);
              return (
                <motion.div
                  key={memory.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.03 }}
                  className={`glass p-5 ${memory.status !== 'open' ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${meta.color}18`, color: meta.color }}>
                      <TypeGlyph type={meta.key} size={11} /> {meta.label}
                    </span>
                    <button onClick={() => remove(memory.id)} className="text-slate-600 hover:text-rose-300 text-xs">✕</button>
                  </div>
                  <h3 className={`font-medium text-slate-100 ${memory.status === 'done' ? 'line-through' : ''}`}>{memory.title}</h3>
                  {memory.description && <p className="text-sm text-slate-400 mt-1.5 whitespace-pre-wrap">{memory.description}</p>}
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-[10px] text-slate-600 mr-auto">
                      {new Date(memory.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {memory.status === 'open' ? (
                      <>
                        <button onClick={() => setStatus(memory.id, 'done')} className="text-[11px] text-emerald-300/80 hover:text-emerald-200">✓ resolved</button>
                        <button onClick={() => setStatus(memory.id, 'dropped')} className="text-[11px] text-slate-500 hover:text-slate-400">let go</button>
                      </>
                    ) : (
                      <button onClick={() => setStatus(memory.id, 'open')} className="text-[11px] text-indigo-300/80">reopen</button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
