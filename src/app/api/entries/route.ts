import { prisma } from '@/lib/db';
import { getUserFromRequest, jsonError } from '@/lib/auth';
import { normalizeMood, moodMeta, suggestTags, suggestCategory, estimateMood } from '@/lib/mood';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100);
  const category = url.searchParams.get('category');
  const mood = normalizeMood(url.searchParams.get('mood'));

  const entries = await prisma.entry.findMany({
    where: {
      userId: user.id,
      ...(category ? { category } : {}),
      ...(mood ? { mood } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  return Response.json({ entries });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  if (!body?.content?.trim()) return jsonError('Content required');

  const content = String(body.content).trim().slice(0, 10000);
  const mood = normalizeMood(body.mood) ?? estimateMood(content);
  const moodScore = mood ? moodMeta(mood)?.score ?? null : null;
  const tags = Array.isArray(body.tags) && body.tags.length
    ? body.tags.map(String).slice(0, 8).join(',')
    : suggestTags(content).join(',');
  const category = typeof body.category === 'string' && body.category
    ? body.category
    : suggestCategory(content);

  const entry = await prisma.entry.create({
    data: {
      userId: user.id,
      content,
      mood,
      moodScore,
      category,
      tags,
      source: ['web', 'telegram', 'miniapp'].includes(body.source) ? body.source : 'web'
    }
  });
  return Response.json({ entry });
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonError('id required');
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) return jsonError('Not found', 404);
  await prisma.entry.delete({ where: { id } });
  return Response.json({ ok: true });
}
