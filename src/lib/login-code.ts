import crypto from 'crypto';

// 4 bytes -> 8 uppercase hex chars (~4.3e9 combinations).
// The previous sources were Math.random() and a 3-byte code, both too weak
// once an unauthenticated endpoint accepts the code without throttling.
const CODE_BYTES = 4;

export function generateLoginCode(): string {
  return crypto.randomBytes(CODE_BYTES).toString('hex').toUpperCase();
}
