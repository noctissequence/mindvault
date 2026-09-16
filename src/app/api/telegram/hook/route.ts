import { handleUpdate } from '@/lib/bot';

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  if (secret && request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return Response.json({ ok: true });
  }
  const update = await request.json().catch(() => null);
  if (update) await handleUpdate(update);
  return Response.json({ ok: true });
}
