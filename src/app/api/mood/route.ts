import { prisma } from '@/lib/db';
import { getUserFromRequest, jsonError } from '@/lib/auth';
import { normalizeMood, moodMeta } from '@/lib/mood';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const url = new URL(request.url);
  const days = Math.min(Number(url.searchParams.get('days') || 7), 90);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const logs = await prisma.moodLog.findMany({
    where: { userId: user.id, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' }
  });
  return Response.json({ logs });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const mood = normalizeMood(body?.mood);
  if (!mood) return jsonError('Valid mood required (happy|okay|neutral|sad|anxiety|angry)');

  const meta = moodMeta(mood);
  const note = typeof body?.note === 'string' ? body.note.slice(0, 500) : null;

  const log = await prisma.moodLog.create({
    data: { userId: user.id, mood, score: meta?.score ?? 3, note }
  });
  return Response.json({ log });
}
