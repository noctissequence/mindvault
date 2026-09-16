// Sliding-window limiter for the passwordless code login.
//
// The app runs as a single Next.js process, so module-level state is shared
// across requests. A per-IP cap stops one attacker; the global cap stops a
// distributed brute force that rotates source IPs. Both are fail-closed.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 5;
const MAX_ATTEMPTS_GLOBAL = 40;
const MAX_TRACKED_IPS = 5000;

type AttemptLog = number[];

const attemptsByIp = new Map<string, AttemptLog>();
let globalAttempts: AttemptLog = [];

function prune(timestamps: AttemptLog, now: number): AttemptLog {
  return timestamps.filter(timestamp => now - timestamp < WINDOW_MS);
}

function retryAfterSeconds(timestamps: AttemptLog, now: number): number {
  if (timestamps.length === 0) return 0;
  const oldest = Math.min(...timestamps);
  return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}

function forgetOldestIps(): void {
  if (attemptsByIp.size <= MAX_TRACKED_IPS) return;
  const overflow = attemptsByIp.size - MAX_TRACKED_IPS;
  const keys = attemptsByIp.keys();
  for (let removed = 0; removed < overflow; removed += 1) {
    const next = keys.next();
    if (next.done) return;
    attemptsByIp.delete(next.value);
  }
}

export function clientIp(request: Request): string {
  const header = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip');
  return (header || 'unknown').trim();
}

export type RateVerdict = { allowed: true } | { allowed: false; retryAfter: number };

export function checkLoginRate(request: Request): RateVerdict {
  const now = Date.now();
  globalAttempts = prune(globalAttempts, now);
  if (globalAttempts.length >= MAX_ATTEMPTS_GLOBAL) {
    return { allowed: false, retryAfter: retryAfterSeconds(globalAttempts, now) };
  }

  const ip = clientIp(request);
  const forIp = prune(attemptsByIp.get(ip) || [], now);
  attemptsByIp.set(ip, forIp);
  if (forIp.length >= MAX_ATTEMPTS_PER_IP) {
    return { allowed: false, retryAfter: retryAfterSeconds(forIp, now) };
  }
  return { allowed: true };
}

export function recordLoginFailure(request: Request): void {
  const now = Date.now();
  const ip = clientIp(request);

  const forIp = prune(attemptsByIp.get(ip) || [], now);
  forIp.push(now);
  attemptsByIp.set(ip, forIp);

  globalAttempts = prune(globalAttempts, now);
  globalAttempts.push(now);
  forgetOldestIps();
}

export function clearLoginFailures(request: Request): void {
  attemptsByIp.delete(clientIp(request));
}

export function rateLimited(retryAfter: number): Response {
  return Response.json(
    { error: 'Too many attempts — try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
