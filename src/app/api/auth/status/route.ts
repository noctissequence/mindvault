import { prisma } from '@/lib/db';

export async function GET() {
  const user = await prisma.user.findFirst();
  return Response.json({
    exists: Boolean(user),
    linked: Boolean(user?.telegramId),
    displayName: user?.displayName || null,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || ''
  });
}
