import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { redisClient, isRedisAvailable } from "../db/redis.js";
import { JWT_SECRET } from "../config/secrets.js";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Exam mode.
 *
 * A cohort sitting an assessment often shares one public IP (a college lab or
 * campus NAT). Per-IP ceilings then make hundreds of students compete for a
 * single allowance — the first 30 logins or 40 submissions would lock everyone
 * else out. When EXAM_MODE=true the ceilings are lifted and authenticated
 * traffic is bucketed per candidate (see userOrIpKey) instead of per IP.
 */
const EXAM_MODE = String(process.env.EXAM_MODE || "").toLowerCase() === "true";
const examScale = EXAM_MODE ? 100 : 1;

/**
 * Buckets the limit by the authenticated candidate rather than the client IP.
 *
 * Verified access tokens key on the user id, so a shared NAT IP no longer
 * spreads one budget across a whole class. Anything unauthenticated — or any
 * invalid/expired token — falls back to the normalised client IP, so login and
 * registration keep their per-IP brute-force protection.
 */
const userOrIpKey = (req) => {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded?.id) return `user:${decoded.id}`;
    } catch {
      /* invalid or expired token: fall back to IP keying */
    }
    // Well-formed but unverifiable token: keep it off the shared IP bucket so a
    // token-spray cannot exhaust a real user's allowance, yet stay finite.
    return `tok:${crypto.createHash("sha256").update(token).digest("hex")}`;
  }
  return `ip:${ipKeyGenerator(req.ip)}`;
};

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

// -- Login: 30 attempts per 15 min per IP (exam mode lifts this for shared NAT) -
export const loginLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: (isDev ? 250 : 30) * examScale,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: "Too many login attempts from this IP. Please try again in 15 minutes.",
    }),
});

// -- Register: 15 new accounts per hour per IP --------------------------------
export const registerLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: (isDev ? 100 : 15) * examScale,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: "Too many accounts created from this IP. Please try again later.",
    }),
});

// -- Global API: 600 requests per 15 min per authenticated candidate ----------
export const apiLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600 * examScale,
  keyGenerator: userOrIpKey,
  message: { success: false, error: "Too many requests. Please slow down and try again later." },
});

// -- Submissions: 40 per 10 min per authenticated candidate -------------------
export const submissionLimiter = makeRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40 * examScale,
  keyGenerator: userOrIpKey,
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
