import { prisma } from './db';
import { tg, sendMessage, userByTelegramId, miniAppUrl } from './telegram';
import { normalizeMood, estimateMood, suggestTags, suggestCategory, MOODS, moodMeta } from './mood';

const MORNING_TEXT = [
  '☀️ <b>Morning check-in</b>',
  '',
  'Three questions:',
  '1. How do you feel?',
  '2. What is important today?',
  '3. What should you not forget?',
  '',
  'Reply with a note, or tap your mood below.'
].join('\n');

const NIGHT_TEXT = [
  '🌙 <b>Night reflection</b>',
  '',
  '• What was heavy today?',
  '• What did you accomplish?',
  '• What are you grateful for?',
  '',
  'Dump it here — even one line counts.'
].join('\n');

function moodKeyboard() {
  return {
    inline_keyboard: [
      MOODS.filter(m => m.key !== 'neutral').slice(0, 3).map(m => ({ text: `${m.emoji} ${m.label}`, callback_data: `mood:${m.key}` })),
      MOODS.filter(m => m.key !== 'neutral').slice(3).map(m => ({ text: `${m.emoji} ${m.label}`, callback_data: `mood:${m.key}` }))
    ]
  };
}

async function saveEntry(telegramId: string, content: string, source = 'telegram') {
  const user = await userByTelegramId(telegramId);
  if (!user) return null;
  const mood = estimateMood(content);
  const entry = await prisma.entry.create({
    data: {
      userId: user.id,
      content: content.slice(0, 10000),
      mood,
      moodScore: mood ? moodMeta(mood)?.score ?? null : null,
      category: suggestCategory(content),
      tags: suggestTags(content).join(','),
      source
    }
  });
  return { entry, user };
}

export async function handleUpdate(update: any): Promise<void> {
  try {
    if (update.callback_query) {
      const cq = update.callback_query;
      const data: string = cq.data || '';
      const chatId = cq.message?.chat?.id;
      if (!chatId) return;
      if (data.startsWith('mood:')) {
        const mood = normalizeMood(data.slice(5));
        const user = await userByTelegramId(chatId);
        if (user && mood) {
          await prisma.moodLog.create({ data: { userId: user.id, mood, score: moodMeta(mood)?.score ?? 3 } });
          const meta = moodMeta(mood);
          await tg('answerCallbackQuery', { callback_query_id: cq.id, text: `Noted: ${meta?.label} ${meta?.emoji}` });
          await sendMessage(chatId, `${meta?.emoji} Saved. ${mood === 'happy' ? 'Glad today is light.' : 'Thanks for checking in. It matters.'}`);
        }
      }
      return;
    }

    const message = update.message;
    if (!message?.text) return;
    const chatId = message.chat.id;
    const text = message.text.trim();
    const cmd = text.split(/\s+/)[0].toLowerCase().split('@')[0];
    const arg = text.slice(cmd.length).trim();

    // /start with or without link payload
    if (cmd === '/start') {
      // Auto-claim: any pending mini-app/web login token for this chat links now.
      const pending = await prisma.loginToken.findFirst({ where: { telegramId: String(chatId), expires: { gt: new Date() } } });
      if (pending) {
        const existing = await userByTelegramId(chatId);
        const target = existing ?? await prisma.user.findFirst();
        if (target) {
          const username = message.from?.username ? `@${message.from.username}` : null;
          await prisma.user.update({ where: { id: target.id }, data: { telegramId: String(chatId), telegramUsername: username } });
          await prisma.loginToken.delete({ where: { id: pending.id } });
          await sendMessage(chatId, '🔗 Linked! This Telegram is now your MindVault capture line.\n\nSend /note anything, anytime — even just plain text.');
          return;
        }
      }
      if (arg.startsWith('link_')) {
        const code = arg.slice(5).toUpperCase();
        const link = await prisma.linkCode.findFirst({ where: { code, expires: { gt: new Date() } } });
        if (!link) {
          await sendMessage(chatId, 'That link code expired or is wrong. Generate a new one in MindVault → Settings → Telegram.');
          return;
        }
        const username = message.from?.username ? `@${message.from.username}` : null;
        await prisma.user.update({ where: { id: link.userId }, data: { telegramId: String(chatId), telegramUsername: username } });
        await prisma.linkCode.delete({ where: { id: link.id } });
        await sendMessage(chatId, '🔗 Linked! This Telegram is now your MindVault capture line.\n\nSend /note anything, anytime — even just plain text. It lands in your vault.');
        return;
      }
      await sendMessage(chatId, [
        '🌙 <b>Welcome to MindVault</b>',
        '',
        'Your quiet room for thoughts, feelings, and memories.',
        '',
        '/note — save a thought',
        '/mood — check in with yourself',
        '/dump — brain dump mode',
        '/remind HH:MM message — set a reminder',
        '/memory title | details — keep something important',
        '/reflect — pattern summary',
        '/help — everything',
        '',
        'To connect your account: MindVault → Settings → Telegram.'
      ].join('\n'), miniAppUrl() ? {
        keyboard: [
          [{ text: '📝 Write Note' }, { text: '🙂 Check Mood' }],
          [{ text: '⭐ Reminder' }, { text: '🧠 Memory' }],
          [{ text: '🌙 Open MindVault', web_app: { url: miniAppUrl() } }]
        ],
        resize_keyboard: true
      } : undefined);
      return;
    }

    if (cmd === '/help') {
      await sendMessage(chatId, [
        '🌙 <b>MindVault commands</b>',
        '',
        '/note &lt;text&gt; — save a thought',
        '/mood — how are you feeling?',
        '/dump — brain dump mode (send /done to stop)',
        '/remind 08:30 take meds — daily reminder',
        '/reminders — list reminders',
        '/memory title | details — important/promise/idea/problem',
        '/reflect — what patterns I noticed',
        '',
        'Plain text (no command) also saves as a note.',
        'Nothing here is judged. Write anything.'
      ].join('\n'));
      return;
    }

    const user = await userByTelegramId(chatId);
    if (!user) {
      if (cmd === '/link' || cmd === '/note' || cmd === '/mood' || cmd === '/dump') {
        await sendMessage(chatId, 'This chat is not linked yet. Open MindVault → Settings → Telegram → generate a code, then send /link CODE here.');
      }
      return;
    }

    // /link with code
    if (cmd === '/link') {
      // Accepts either a 6-char web code or a mini-app claim token.
      const claim = await prisma.loginToken.findFirst({ where: { token: arg, telegramId: String(chatId), expires: { gt: new Date() } } });
      if (claim) {
        const target = await prisma.user.findFirst();
        if (target) {
          const username = message.from?.username ? `@${message.from.username}` : null;
          await prisma.user.update({ where: { id: target.id }, data: { telegramId: String(chatId), telegramUsername: username } });
          await prisma.loginToken.delete({ where: { id: claim.id } });
          await sendMessage(chatId, '🔗 Linked! Mini App and bot now share your vault.');
          return;
        }
      }
      const code = arg.toUpperCase();
      const link = await prisma.linkCode.findFirst({ where: { code, expires: { gt: new Date() } } });
      if (!link) {
        await sendMessage(chatId, 'Code not found or expired. Generate a fresh one in Settings → Telegram.');
        return;
      }
      const username = message.from?.username ? `@${message.from.username}` : null;
      await prisma.user.update({ where: { id: link.userId }, data: { telegramId: String(chatId), telegramUsername: username } });
      await prisma.linkCode.delete({ where: { id: link.id } });
      await sendMessage(chatId, '🔗 Linked! You can now capture thoughts straight from here.');
      return;
    }

    // /login — issue a one-time web login code (passwordless)
    if (cmd === '/login') {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      await prisma.linkCode.deleteMany({ where: { userId: user.id } });
      await prisma.linkCode.create({ data: { code, userId: user.id, expires: new Date(Date.now() + 10 * 60 * 1000) } });
      await sendMessage(chatId, [
        '🔑 <b>Web login code</b>',
        '',
        `<code>${code}</code>`,
        '',
        'Valid 10 minutes. Enter it on the website — no password needed.'
      ].join('\n'));
      return;
    }

    // mood command
    if (cmd === '/mood') {
      if (arg) {
        const mood = normalizeMood(arg);
        if (!mood) {
          await sendMessage(chatId, 'Try: happy, okay, sad, anxiety, angry — or /mood for buttons.');
          return;
        }
        await prisma.moodLog.create({ data: { userId: user.id, mood, score: moodMeta(mood)?.score ?? 3 } });
        const meta = moodMeta(mood);
        await sendMessage(chatId, `${meta?.emoji} Saved. ${mood === 'happy' ? 'Hold onto that.' : 'Thanks for being honest with yourself.'}`);
        return;
      }
      await sendMessage(chatId, 'How are you feeling right now?', moodKeyboard());
      return;
    }

    // brain dump mode
    if (cmd === '/dump') {
      await prisma.user.update({ where: { id: user.id }, data: { nightTime: user.nightTime } }); // touch (no-op)
      (globalThis as any).__mindvaultDump = (globalThis as any).__mindvaultDump || new Set();
      (globalThis as any).__mindvaultDump.add(chatId);
      await sendMessage(chatId, '🧠 <b>Brain dump mode.</b>\nSend everything on your mind — one message or many. No order needed.\n\n/done when your head is lighter.');
      return;
    }
    if (cmd === '/done') {
      const dumps: Set<number> = (globalThis as any).__mindvaultDump || new Set();
      if (dumps.delete(chatId)) {
        await sendMessage(chatId, 'Dump saved. Everything went into your journal. Rest your head now. 🌙');
      }
      return;
    }

    // reminders
    if (cmd === '/remind') {
      const match = arg.match(/^([01]\d|2[0-3]):([0-5]\d)\s+([\s\S]+)$/);
      if (!match) {
        await sendMessage(chatId, 'Format: /remind HH:MM message\nExample: /remind 21:00 journal before sleep');
        return;
      }
      await prisma.reminder.create({
        data: { userId: user.id, schedule: `${match[1]}:${match[2]}`, message: match[3].slice(0, 500) }
      });
      await sendMessage(chatId, `⭐ Daily reminder set for <b>${match[1]}:${match[2]}</b>:\n"${match[3]}"`);
      return;
    }
    if (cmd === '/reminders') {
      const reminders = await prisma.reminder.findMany({ where: { userId: user.id, enabled: true }, orderBy: { schedule: 'asc' } });
      if (!reminders.length) {
        await sendMessage(chatId, 'No reminders yet. Add one: /remind 08:00 drink water');
        return;
      }
      await sendMessage(chatId, ['⭐ <b>Your reminders</b>', '', ...reminders.map(r => `${r.schedule} — ${r.message}`)].join('\n'));
      return;
    }

    // memories
    if (cmd === '/memory') {
      const [title, ...rest] = arg.split('|');
      if (!title.trim()) {
        await sendMessage(chatId, 'Format: /memory title | details\nExample: /memory Talk to mom Sunday | she asked twice already');
        return;
      }
      const type = /\b(promise|janji)\b/i.test(arg) ? 'promise' : /\b(idea|ide)\b/i.test(arg) ? 'idea' : /\b(problem|masalah)\b/i.test(arg) ? 'problem' : 'important';
      const memory = await prisma.memory.create({
        data: { userId: user.id, title: title.trim().slice(0, 200), description: rest.join('|').trim().slice(0, 2000), type }
      });
      await sendMessage(chatId, `🧠 Kept in your vault (${memory.type}):\n<b>${memory.title}</b>`);
      return;
    }

    // deterministic reflection (rule-based, no LLM)
    if (cmd === '/reflect') {
      const since = new Date(Date.now() - 7 * 86400000);
      const [logs, entries] = await Promise.all([
        prisma.moodLog.findMany({ where: { userId: user.id, createdAt: { gte: since } } }),
        prisma.entry.findMany({ where: { userId: user.id, createdAt: { gte: since } } })
      ]);
      if (!logs.length && !entries.length) {
        await sendMessage(chatId, 'Not enough data yet this week. Write a few notes and check your mood — then ask me again.');
        return;
      }
      const counts: Record<string, number> = {};
      for (const log of logs) counts[log.mood] = (counts[log.mood] || 0) + 1;
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const tagCounts: Record<string, number> = {};
      for (const entry of entries) {
        for (const tag of entry.tags.split(',').filter(Boolean)) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
      const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
      const lines = ['📊 <b>Last 7 days</b>', ''];
      if (top) lines.push(`Dominant mood: <b>${top[0]}</b> (${top[1]}×)`);
      if (topTag) lines.push(`Most mentioned topic: <b>#${topTag[0]}</b> (${topTag[1]}×)`);
      lines.push(`Notes captured: <b>${entries.length}</b>`);
      const heavy = entries.filter(entry => ['anxiety', 'sad', 'angry'].includes(entry.mood || '')).length;
      if (heavy >= 3) lines.push('', `Heavy moments came up ${heavy}×. Consider smaller loads tomorrow — and sleep before midnight.`);
      else lines.push('', 'Week looks steady. Keep the small routines going.');
      await sendMessage(chatId, lines.join('\n'));
      return;
    }

    // plain text → note (fastest capture, no command needed)
    const saved = await saveEntry(chatId, text);
    if (!saved) return;
    const moodLabel = saved.entry.mood ? `mood: ${saved.entry.mood}` : '';
    const tags = saved.entry.tags ? `\n#️⃣ ${saved.entry.tags.split(',').map(t => `#${t.trim()}`).join(' ')}` : '';
    await sendMessage(chatId, [
      '🌙 Saved to your vault.',
      moodLabel,
      tags,
      '',
      '<i>It is safe here.</i>'
    ].filter(Boolean).join('\n'));
  } catch (error) {
    console.error('[bot] update failed:', error);
  }
}

export { MORNING_TEXT, NIGHT_TEXT };
