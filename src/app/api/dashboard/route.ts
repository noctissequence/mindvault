import { prisma } from '@/lib/db';
import { getUserFromRequest, jsonError } from '@/lib/auth';
import { suggestTags, suggestCategory } from '@/lib/mood';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return jsonError('Unauthorized', 401);

  const now = Date.now();
  const since7d = new Date(now - 7 * 86400000);
  const since3d = new Date(now - 3 * 86400000);
  const yesterday = new Date(now - 86400000);

  const [recentEntries, moodLogs, moodLogs3d, openMemories, totalEntries] = await Promise.all([
    prisma.entry.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.moodLog.findMany({ where: { userId: user.id, createdAt: { gte: since7d } }, orderBy: { createdAt: 'asc' } }),
    prisma.moodLog.findMany({ where: { userId: user.id, createdAt: { gte: since3d } } }),
    prisma.memory.count({ where: { userId: user.id, status: 'open' } }),
    prisma.entry.count({ where: { userId: user.id } })
  ]);

  // mood distribution, 7 days
  const moodCounts: Record<string, number> = {};
  for (const log of moodLogs) moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;

  // pattern detection: average mood score in last 3 days vs previous 4
  const score3d = moodLogs3d.reduce((sum, log) => sum + log.score, 0) / (moodLogs3d.length || 1);
  const prev4 = moodLogs.filter(log => log.createdAt < since3d);
  const scorePrev = prev4.reduce((sum, log) => sum + log.score, 0) / (prev4.length || 1);

  let pattern: string | null = null;
  if (moodLogs3d.length >= 3 && prev4.length >= 3) {
    const delta = score3d - scorePrev;
    if (delta <= -0.5) {
      const worst = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      pattern = worst
        ? `Your ${worst} is trending up during the last 3 days. Be gentle with yourself.`
        : 'Your mood has dipped during the last 3 days. Be gentle with yourself.';
    } else if (delta >= 0.5) {
      pattern = 'Your mood has been lifting over the last 3 days. Keep going.';
    }
  }

  // today's small wins = entries tagged/keyword "win" or category promise done today
  const winsKeywords = ['win', 'shower', 'ate', 'eat', 'makan', 'mandi', 'survived', 'survive', 'accomplished', 'managed'];
  const todayEntries = await prisma.entry.findMany({
    where: { userId: user.id, createdAt: { gte: yesterday } },
    orderBy: { createdAt: 'desc' }
  });
  const wins = todayEntries
    .filter(entry => winsKeywords.some(word => entry.content.toLowerCase().includes(word)))
    .slice(0, 4);

  return Response.json({
    user: { displayName: user.displayName, timezone: user.timezone, telegramLinked: Boolean(user.telegramId) },
    stats: { totalEntries, openMemories, moodLogs7d: moodLogs.length },
    latestEntries: recentEntries,
    moodCounts,
    moodTrend: moodLogs.map(log => ({ mood: log.mood, score: log.score, createdAt: log.createdAt })),
    pattern,
    wins
  });
}
