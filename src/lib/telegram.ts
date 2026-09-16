import { prisma } from './db';

const BOT_API = 'https://api.telegram.org';

export function botToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export async function tg(method: string, payload: Record<string, unknown>) {
  const token = botToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BOT_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function sendMessage(chatId: string | number, text: string, replyMarkup?: unknown) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup ?? { remove_keyboard: true }
  });
}

export function mainMenuKeyboard(webAppUrl?: string) {
  const buttons: { text: string; web_app?: { url: string } }[][] = [
    [{ text: '📝 Write Note' }, { text: '🙂 Check Mood' }],
    [{ text: '⭐ Reminder' }, { text: '🧠 Memory' }]
  ];
  if (webAppUrl) {
    buttons.push([{ text: '🌙 Open MindVault', web_app: { url: webAppUrl } }]);
  } else {
    buttons.push([{ text: '⚙ More' }]);
  }
  return { keyboard: buttons, resize_keyboard: true };
}

export function miniAppUrl(): string {
  return process.env.TELEGRAM_WEBAPP_URL || process.env.APP_URL || '';
}

// Telegram deep-link login token, stored in memory of the API process.
const loginTokens = new Map<string, { telegramId: string; expires: number }>();

export function createLoginToken(telegramId: string): string {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  loginTokens.set(token, { telegramId, expires: Date.now() + 10 * 60 * 1000 });
  return token;
}

export function consumeLoginToken(token: string): string | null {
  const entry = loginTokens.get(token);
  if (!entry || entry.expires < Date.now()) {
    loginTokens.delete(token);
    return null;
  }
  loginTokens.delete(token);
  return entry.telegramId;
}

export async function userByTelegramId(telegramId: string) {
  return prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
}
