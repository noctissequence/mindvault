// MindVault worker: Telegram long-poll + reminder scheduler.
// Runs as a separate systemd service; no public webhook needed.
import { prisma } from '../src/lib/db';
import { handleUpdate, MORNING_TEXT, NIGHT_TEXT } from '../src/lib/bot';
import { sendMessage } from '../src/lib/telegram';
import { botToken, tg, moodKeyboardHelper } from '../src/lib/worker-helpers';

const POLL_TIMEOUT_S = 25;
let offset = 0;

function nowHMInTZ(timezone: string): { hm: string; ymd: string } {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    const hm = `${parts.hour}:${parts.minute}`;
    const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    return { hm, ymd: dayFmt.format(new Date()) };
  } catch {
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { hm, ymd: now.toISOString().slice(0, 10) };
  }
}

async function pollOnce(): Promise<void> {
  const res = await tg('getUpdates', { offset, timeout: POLL_TIMEOUT_S, allowed_updates: ['message', 'callback_query'] });
  if (res && Array.isArray(res.result)) {
    for (const update of res.result) {
      offset = Math.max(offset, update.update_id + 1);
      await handleUpdate(update);
    }
  }
}

async function pollLoop(): Promise<void> {
  for (;;) {
    try {
      await pollOnce();
    } catch (error) {
      console.error('[worker] poll error:', error instanceof Error ? error.message : error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function tickReminders(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    include: { reminders: { where: { enabled: true } } }
  });
  for (const user of users) {
    const { hm, ymd } = nowHMInTZ(user.timezone);
    // custom reminders
    for (const reminder of user.reminders) {
      if (reminder.schedule === hm && reminder.lastSentYMD !== ymd) {
        await sendMessage(user.telegramId!, `⭐ <b>Reminder</b>\n\n${reminder.message}`);
        await prisma.reminder.update({ where: { id: reminder.id }, data: { lastSentYMD: ymd } });
      }
    }
    // morning check-in
    if (user.morningReminder && user.morningTime === hm && !(user as any).__morningSent) {
      const key = `morning:${user.id}:${ymd}`;
      const sent = await prisma.linkCode.count({ where: { code: key } }).catch(() => 0);
      if (!sent) {
        await sendMessage(user.telegramId!, MORNING_TEXT, moodKeyboardHelper());
        // marker row keeps exactly-once per day (id is cuid; code column holds the key)
        await prisma.linkCode.create({ data: { code: key, userId: user.id, expires: new Date(Date.now() + 86400000) } }).catch(() => null);
      }
    }
    // night reflection
    if (user.nightReminder && user.nightTime === hm) {
      const key = `night:${user.id}:${ymd}`;
      const sent = await prisma.linkCode.count({ where: { code: key } }).catch(() => 0);
      if (!sent) {
        await sendMessage(user.telegramId!, NIGHT_TEXT);
        await prisma.linkCode.create({ data: { code: key, userId: user.id, expires: new Date(Date.now() + 86400000) } }).catch(() => null);
      }
    }
  }
}

async function schedulerLoop(): Promise<void> {
  for (;;) {
    try {
      await tickReminders();
    } catch (error) {
      console.error('[worker] scheduler error:', error instanceof Error ? error.message : error);
    }
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

async function main() {
  if (!botToken()) {
    console.log('[worker] TELEGRAM_BOT_TOKEN empty — reminders still run, bot polling disabled');
  }
  console.log('[worker] MindVault worker started');
  schedulerLoop().catch(() => process.exit(1));
  if (botToken()) {
    pollLoop().catch(() => process.exit(1));
  }
}

main().catch(error => {
  console.error('[worker] fatal:', error);
  process.exit(1);
});
