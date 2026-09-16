import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getUserFromRequest, jsonError } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  return Response.json({
    linked: Boolean(user.telegramId),
    telegramUsername: user.telegramUsername,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || ''
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  if (!process.env.TELEGRAM_BOT_TOKEN) return jsonError('Bot token not configured on this server', 503);

  const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char code
  await prisma.linkCode.deleteMany({ where: { userId: user.id } });
  await prisma.linkCode.create({
    data: { code, userId: user.id, expires: new Date(Date.now() + 15 * 60 * 1000) }
  });
  return Response.json({
    code,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
    expiresMinutes: 15
  });
}
