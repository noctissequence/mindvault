import { prisma } from '@/lib/db';

// Unauthenticated: the login screen needs to know whether a vault exists and
// which bot to offer. It must not disclose the owner's name or link state.
export async function GET() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  return Response.json({
    exists: Boolean(user),
    botUsername: process.env.TELEGRAM_BOT_USERNAME || ''
  });
}
