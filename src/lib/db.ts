import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Resolve absolute path for database
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl?.startsWith('file:')) {
    const relativePath = dbUrl.replace('file:', '');
    const absolutePath = path.join(process.cwd(), relativePath);
    return `file:${absolutePath}`;
  }
  return dbUrl;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
