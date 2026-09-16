// Mood vocabulary + mapping shared by web, bot, and Mini App.
export type Mood = 'happy' | 'okay' | 'neutral' | 'sad' | 'anxiety' | 'angry';

export const MOODS: { key: Mood; emoji: string; label: string; score: number; color: string }[] = [
  { key: 'happy', emoji: '😀', label: 'Great', score: 5, color: '#34D399' },
  { key: 'okay', emoji: '🙂', label: 'Okay', score: 4, color: '#FBBF24' },
  { key: 'neutral', emoji: '😐', label: 'Neutral', score: 3, color: '#94A3B8' },
  { key: 'sad', emoji: '😞', label: 'Sad', score: 2, color: '#60A5FA' },
  { key: 'anxiety', emoji: '😰', label: 'Anxious', score: 1, color: '#C084FC' },
  { key: 'angry', emoji: '😠', label: 'Angry', score: 1, color: '#FB7185' }
];

export function normalizeMood(raw?: string | null): Mood | null {
  if (!raw) return null;
  const value = raw.toLowerCase().trim();
  const aliases: Record<string, Mood> = {
    happy: 'happy', great: 'happy', good: 'happy', senang: 'happy', bahagia: 'happy',
    okay: 'okay', ok: 'okay', fine: 'okay', baik: 'okay',
    neutral: 'neutral', meh: 'neutral', biasa: 'neutral',
    sad: 'sad', down: 'sad', sedih: 'sad', galau: 'sad',
    anxiety: 'anxiety', anxious: 'anxiety', cemas: 'anxiety', anxious_mood: 'anxiety', overwhelmed: 'anxiety',
    angry: 'angry', anger: 'angry', marah: 'angry', stress: 'angry'
  };
  return aliases[value] ?? null;
}

export function moodMeta(key: string | null | undefined) {
  return MOODS.find(m => m.key === key) ?? null;
}

// Deterministic keyword-based mood estimation for /note captures.
const MOOD_KEYWORDS: { mood: Mood; words: string[] }[] = [
  { mood: 'anxiety', words: ['overwhelm', 'anxious', 'anxiety', 'cemas', 'panik', 'panic', 'worry', 'worried', 'overthink', 'takut', 'afraid', 'restless', 'gelisah'] },
  { mood: 'sad', words: ['sad', 'sedih', 'down', 'cry', 'nangis', 'empty', 'hampa', 'lonely', 'sendiri', 'hurt', 'sakit hati', 'galau'] },
  { mood: 'angry', words: ['angry', 'marah', 'mad', 'furious', 'kesel', 'annoyed', 'frustrated', 'frustrasi', 'hate', 'benci'] },
  { mood: 'happy', words: ['happy', 'senang', 'great', 'amazing', 'excited', 'grateful', 'bersyukur', 'love', 'joy', 'bahagia', 'proud', 'bangga'] }
];

export function estimateMood(content: string): Mood | null {
  const text = content.toLowerCase();
  for (const group of MOOD_KEYWORDS) {
    if (group.words.some(w => text.includes(w))) return group.mood;
  }
  return null;
}

export const TAG_RULES: { tag: string; words: string[] }[] = [
  { tag: 'work', words: ['work', 'kerja', 'kantor', 'deadline', 'boss', 'meeting', 'project', 'dosen', 'kuliah', 'tugas', 'exam', 'ujian'] },
  { tag: 'money', words: ['money', 'duit', 'uang', 'budget', 'hemat', 'tagihan', 'bill', 'debt', 'utang'] },
  { tag: 'health', words: ['sick', 'sakit', 'tired', 'lelah', 'sleep', 'tidur', 'insomnia', 'doctor', 'dokter'] },
  { tag: 'relationship', words: ['friend', 'teman', 'family', 'keluarga', 'mom', 'dad', 'ibu', 'ayah', 'partner', 'pacar', 'gebetan'] },
  { tag: 'self', words: ['myself', 'diri', 'habit', 'kebiasaan', 'goal', 'target', 'promise', 'janji'] }
];

export function suggestTags(content: string): string[] {
  const text = content.toLowerCase();
  return TAG_RULES.filter(r => r.words.some(w => text.includes(w))).map(r => r.tag);
}

export function suggestCategory(content: string): string {
  const text = content.toLowerCase();
  if (/^(idea|ide|what if|bagaimana kalau|imagine)/.test(text)) return 'idea';
  if (/\b(promise|janji|i will|aku akan|commit)\b/.test(text)) return 'promise';
  if (/\b(problem|masalah|stuck|issue|blocked)\b/.test(text)) return 'problem';
  if (/\b(remember|ingat|jangan lupa|don'?t forget|important)\b/.test(text)) return 'memory';
  return 'note';
}
