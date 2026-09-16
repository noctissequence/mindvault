import { prisma } from '@/lib/db';
import { getUserFromRequest, jsonError } from '@/lib/auth';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const reminders = await prisma.reminder.findMany({
    where: { userId: user.id },
    orderBy: { schedule: 'asc' }
  });
  return Response.json({ reminders });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  if (!body?.message?.trim()) return jsonError('Message required');
  if (!HHMM.test(body.schedule || '')) return jsonError('Schedule must be HH:MM (24h)');

  const reminder = await prisma.reminder.create({
    data: {
      userId: user.id,
      message: String(body.message).trim().slice(0, 500),
      schedule: body.schedule
    }
  });
  return Response.json({ reminder });
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id) return jsonError('id required');

  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.userId !== user.id) return jsonError('Not found', 404);

  const data: { enabled?: boolean; message?: string; schedule?: string } = {};
  if (typeof body.enabled === 'boolean') data.enabled = body.enabled;
  if (body.message) data.message = String(body.message).slice(0, 500);
  if (body.schedule && HHMM.test(body.schedule)) data.schedule = body.schedule;

  const updated = await prisma.reminder.update({ where: { id }, data });
  return Response.json({ reminder: updated });
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('id required');
  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.userId !== user.id) return jsonError('Not found', 404);
  await prisma.reminder.delete({ where: { id } });
  return Response.json({ ok: true });
}
