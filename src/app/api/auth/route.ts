import { prisma } from '@/lib/db';
import { signToken, jsonError } from '@/lib/auth';
import { checkLoginRate, recordLoginFailure, clearLoginFailures, rateLimited } from '@/lib/rate-limit';

// First-run setup: creates the ONE owner of this personal vault. No password —
// Telegram is the authentication (claim happens via /start or /login code).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const displayName = String(body?.displayName || '').trim();
  if (!displayName) return jsonError('Display name required');

  const existing = await prisma.user.findFirst();
  if (existing) return jsonError('Vault already exists — sign in with your Telegram code', 409);

  const user = await prisma.user.create({
    data: { email: `owner@${process.env.TELEGRAM_BOT_USERNAME || 'mindvault'}.local`, passwordHash: '!', displayName: displayName.slice(0, 60) }
  });
  return Response.json({ ok: true, botUsername: process.env.TELEGRAM_BOT_USERNAME || '' });
}

// Code login (issued by /login in the bot). Unauthenticated by design, so it is
// rate limited per IP and globally — otherwise the code is brute-forceable.
export async function PUT(request: Request) {
  const verdict = checkLoginRate(request);
  if (!verdict.allowed) return rateLimited(verdict.retryAfter);

  const body = await request.json().catch(() => null);
  const code = String(body?.code || '').trim().toUpperCase();
  if (!code) return jsonError('Code required');

  const link = await prisma.linkCode.findFirst({ where: { code, expires: { gt: new Date() } } });
  if (!link) {
    recordLoginFailure(request);
    return jsonError('Invalid or expired code — send /login to the bot for a new one', 401);
  }

  await prisma.linkCode.delete({ where: { id: link.id } });
  clearLoginFailures(request);

  const user = await prisma.user.findUnique({ where: { id: link.userId } });
  if (!user) return jsonError('User gone', 404);
  return Response.json({ token: signToken(user.id), user: { id: user.id, displayName: user.displayName } });
}
