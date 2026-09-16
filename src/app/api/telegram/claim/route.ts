// Web dashboard login via Telegram: user sends /login to the bot, gets a code,
// enters it here. No password involved for the personal vault.
import { prisma } from '@/lib/db';
import { signToken, jsonError } from '@/lib/auth';
import { checkLoginRate, recordLoginFailure, clearLoginFailures, rateLimited } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const verdict = checkLoginRate(request);
  if (!verdict.allowed) return rateLimited(verdict.retryAfter);

  const body = await request.json().catch(() => null);
  const code = String(body?.code || '').trim().toUpperCase();
  if (!code) return jsonError('Code required');

  const user = await prisma.user.findFirst({ where: { telegramId: { not: null } } });
  if (!user) return jsonError('Send /login to the bot first', 404);

  const webCode = await prisma.linkCode.findFirst({ where: { code, expires: { gt: new Date() } } });
  if (webCode) {
    await prisma.linkCode.delete({ where: { id: webCode.id } });
    clearLoginFailures(request);
    return Response.json({ token: signToken(webCode.userId) });
  }

  recordLoginFailure(request);
  return jsonError('Invalid or expired code', 401);
}
