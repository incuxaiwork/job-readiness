import dotenv from 'dotenv';
dotenv.config();

// Railway's internal hostnames (postgres.railway.internal, redis.railway.internal)
// only resolve inside the Railway VPC. Use them in production; use the public
// proxy URLs everywhere else (local development).
const isProduction = process.env.NODE_ENV === 'production';

export const databaseUrl = () =>
  isProduction
    ? process.env.DATABASE_URL
    : process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

export const redisUrl = () =>
  isProduction
    ? process.env.REDIS_URL
    : process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;
