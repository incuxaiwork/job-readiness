import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();
import { databaseUrl } from '../config/urls.js';

const connectionString = (typeof databaseUrl === 'function' ? databaseUrl() : null) || process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
if (!connectionString) {
  console.warn('⚠️ [Prisma] No DATABASE_URL / DATABASE_PUBLIC_URL set.');
}
const adapter = new PrismaPg({ connectionString });

// Global Prisma Client singleton
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
