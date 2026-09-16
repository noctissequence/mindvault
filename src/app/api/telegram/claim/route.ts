// Web dashboard login via Telegram: user sends /login to the bot, gets a code,
// enters it here. No password involved for the personal vault.
import { prisma } from '@/lib/db';
import { signToken, jsonError } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = String(body?.code || '').trim().toUpperCase();
  if (!code) return jsonError('Code required');

  const user = await prisma.user.findFirst({ where: { telegramId: { not: null } } });
  if (!user) return jsonError('Send /login to the bot first', 404);

  const webCode = await prisma.linkCode.findFirst({ where: { code, expires: { gt: new Date() } } });
  if (webCode) {
    await prisma.linkCode.delete({ where: { id: webCode.id } });
    return Response.json({ token: signToken(webCode.userId) });
  }
  return jsonError('Invalid or expired code', 401);
}
