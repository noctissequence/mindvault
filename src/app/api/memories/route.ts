import { prisma } from '@/lib/db';
import { getUserFromRequest, jsonError } from '@/lib/auth';

const TYPES = ['important', 'promise', 'idea', 'problem'];
const STATUSES = ['open', 'done', 'dropped'];

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');

  const memories = await prisma.memory.findMany({
    where: {
      userId: user.id,
      ...(type && TYPES.includes(type) ? { type } : {}),
      ...(status && STATUSES.includes(status) ? { status } : {})
    },
    orderBy: { createdAt: 'desc' }
  });
  return Response.json({ memories });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  if (!body?.title?.trim()) return jsonError('Title required');

  const memory = await prisma.memory.create({
    data: {
      userId: user.id,
      title: String(body.title).trim().slice(0, 200),
      description: String(body.description || '').slice(0, 2000),
      type: TYPES.includes(body.type) ? body.type : 'important',
      status: 'open'
    }
  });
  return Response.json({ memory });
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id) return jsonError('id required');

  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory || memory.userId !== user.id) return jsonError('Not found', 404);

  const data: { status?: string; title?: string; description?: string; type?: string } = {};
  if (body.status && STATUSES.includes(body.status)) data.status = body.status;
  if (body.title) data.title = String(body.title).slice(0, 200);
  if (body.description !== undefined) data.description = String(body.description).slice(0, 2000);
  if (body.type && TYPES.includes(body.type)) data.type = body.type;

  const updated = await prisma.memory.update({ where: { id }, data });
  return Response.json({ memory: updated });
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('id required');
  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory || memory.userId !== user.id) return jsonError('Not found', 404);
  await prisma.memory.delete({ where: { id } });
  return Response.json({ ok: true });
}
