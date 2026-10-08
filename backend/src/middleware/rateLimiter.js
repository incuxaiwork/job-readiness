import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient, isRedisAvailable } from "../db/redis.js";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Builds a rate limiter using Redis store when available, falling back to
 * in-memory store for local dev without Redis.
 */
const makeRateLimiter = (options) => {
  const store = isRedisAvailable()
    ? new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) })
    : undefined;

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
    ...(store ? { store } : {}),
  });
};

// -- Login: 30 attempts per 15 min per IP -------------------------------------
export const loginLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 250 : 30,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: "Too many login attempts from this IP. Please try again in 15 minutes.",
    }),
});

// -- Register: 15 new accounts per hour per IP --------------------------------
export const registerLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 15,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: "Too many accounts created from this IP. Please try again later.",
    }),
});

// -- Global API: 600 requests per 15 min per IP -------------------------------
export const apiLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { success: false, error: "Too many requests. Please slow down and try again later." },
});

// -- Submissions: 40 per 10 min per IP ----------------------------------------
export const submissionLimiter = makeRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { success: false, error: "Submission rate limit reached. Please wait before submitting another attempt." },
});

// -- Per-Account Lockout Helpers (Redis-backed) --------------------------------
const LOCKOUT_THRESHOLD = 10;   // failed attempts before lockout
const LOCKOUT_WINDOW_SEC = 900; // 15 minutes

/**
 * Increment failed login counter for an email.
 * Returns current failure count.
 */
export const recordFailedLogin = async (email) => {
  if (!isRedisAvailable()) return 0;
  try {
    const key = "login_fail:" + email.toLowerCase();
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, LOCKOUT_WINDOW_SEC);
    return count;
  } catch { return 0; }
};

/**
 * Returns true if the account is locked out due to excessive failed attempts.
 */
export const isAccountLockedOut = async (email) => {
  if (!isRedisAvailable()) return false;
  try {
    const key = "login_fail:" + email.toLowerCase();
    const count = parseInt(await redisClient.get(key) || "0", 10);
    return count >= LOCKOUT_THRESHOLD;
  } catch { return false; }
};

/**
 * Clear the failure counter after a successful login.
 */
export const clearFailedLogins = async (email) => {
  if (!isRedisAvailable()) return;
  try { await redisClient.del("login_fail:" + email.toLowerCase()); } catch {}
};
