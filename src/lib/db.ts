import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Standalone server and worker get env from systemd, but manual runs need .env.
function loadEnvFile() {
  const candidates = [
    join(process.cwd(), '.env'),
    // optional explicit override for services that start outside the project dir
    ...(process.env.MINDVAULT_HOME ? [join(process.env.MINDVAULT_HOME, '.env')] : [])
  ];
  for (const path of candidates) {
    try {
      const lines = readFileSync(path, 'utf8').split('\n');
      for (const line of lines) {
        if (!line.includes('=') || line.trim().startsWith('#')) continue;
        const eq = line.indexOf('=');
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();
        if (key && process.env[key] === undefined) process.env[key] = value;
      }
    } catch {
      // missing file is fine
    }
  }
}
loadEnvFile();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
