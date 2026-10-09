import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || 'postgresql://postgres:yqWznfiBimujSCpYREhsaRDWmkeSiIkn@mainline.proxy.rlwy.net:56422/railway';
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
