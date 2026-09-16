// Small helpers shared by the worker (kept out of bot.ts to avoid cycles).
import { tg } from './telegram';
import { MOODS } from './mood';

export { tg };

export function botToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export function moodKeyboardHelper() {
  return {
    inline_keyboard: [
      MOODS.filter(m => m.key !== 'neutral').slice(0, 3).map(m => ({ text: `${m.emoji} ${m.label}`, callback_data: `mood:${m.key}` })),
      MOODS.filter(m => m.key !== 'neutral').slice(3).map(m => ({ text: `${m.emoji} ${m.label}`, callback_data: `mood:${m.key}` }))
    ]
  };
}
