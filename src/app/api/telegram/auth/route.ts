// Telegram Mini App login: verifies initData signature per Telegram WebApp spec.
// secret_key = HMAC_SHA256("WebAppData", bot_token)
// expected   = HMAC_SHA256(secret_key, data_check_string)
// Two paths:
//  A) initData valid AND its telegramId is linked to a user  -> JWT immediately
//  B) initData valid but NOT linked                          -> one-time token;
//     /start or /link <code> in the bot claims it (ownership = whoever controls the chat)
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { signToken, jsonError } from '@/lib/auth';

function verifyInitData(initData: string): { id: string; username?: string; first_name?: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  if (!token || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  // constant-time compare (both are hex, equal length)
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(hash, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  try {
    const user = JSON.parse(params.get('user') || '{}');
    return user?.id ? { id: String(user.id), username: user.username, first_name: user.first_name } : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const initData = body?.initData;
  if (typeof initData !== 'string') return jsonError('initData required');

  const tgUser = verifyInitData(initData);
  if (!tgUser) return jsonError('Invalid Telegram signature', 401);

  const user = await prisma.user.findUnique({ where: { telegramId: tgUser.id } });
  if (user) {
    return Response.json({
      token: signToken(user.id),
      user: { id: user.id, displayName: user.displayName, email: user.email },
      pendingLink: false
    });
  }

  // Not linked yet: hand out a one-time claim token valid 30 minutes.
  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (!anyUser) return jsonError('Create your vault on the web first', 404);
  const claim = crypto.randomBytes(24).toString('hex');
  await prisma.loginToken.create({
    data: { token: claim, telegramId: tgUser.id, expires: new Date(Date.now() + 30 * 60 * 1000) }
  });
  return Response.json({ pendingLink: true, claimToken: claim }, { status: 202 });
}
