import { prisma } from '@/lib/db';
import { getUserFromRequest, jsonError } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/auth';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  return Response.json({
    user: {
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone,
      telegramLinked: Boolean(user.telegramId),
      telegramUsername: user.telegramUsername,
      morningReminder: user.morningReminder,
      nightReminder: user.nightReminder,
      morningTime: user.morningTime,
      nightTime: user.nightTime
    }
  });
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  const body = await request.json().catch(() => null);
  if (!body) return jsonError('Invalid body');

  const data: Record<string, string | boolean> = {};
  if (typeof body.displayName === 'string' && body.displayName.trim()) data.displayName = body.displayName.trim().slice(0, 60);
  if (typeof body.timezone === 'string' && body.timezone.includes('/')) data.timezone = body.timezone.slice(0, 60);
  if (typeof body.morningReminder === 'boolean') data.morningReminder = body.morningReminder;
  if (typeof body.nightReminder === 'boolean') data.nightReminder = body.nightReminder;
  if (typeof body.morningTime === 'string' && HHMM.test(body.morningTime)) data.morningTime = body.morningTime;
  if (typeof body.nightTime === 'string' && HHMM.test(body.nightTime)) data.nightTime = body.nightTime;

  if (body.newPassword) {
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) return jsonError('Password min 8 chars');
    if (!body.currentPassword) return jsonError('Current password required');
    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) return jsonError('Current password wrong', 403);
    data.passwordHash = await hashPassword(body.newPassword);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return Response.json({ ok: true, displayName: updated.displayName });
}
