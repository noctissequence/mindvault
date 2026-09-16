import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const FALLBACK_SECRET = 'dev-only-insecure';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

// Fail closed: a predictable secret in production means anyone can forge sessions.
if (process.env.NODE_ENV === 'production' && JWT_SECRET === FALLBACK_SECRET) {
  throw new Error('JWT_SECRET is not set — refusing to start in production with the default secret.');
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  // Mini App / dashboard can also pass token via query param (Telegram webview cookie edge cases)
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');
  const token = bearer || queryToken;
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ?? null;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
