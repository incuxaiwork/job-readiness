import jwt from "jsonwebtoken";
import { redisClient, isRedisAvailable } from "../db/redis.js";

/**
 * Check if a token has been explicitly revoked (logged out).
 * Uses Redis denylist keyed by jti (JWT ID).
 * Gracefully skips denylist check when Redis is unavailable.
 */
const isTokenRevoked = async (jti) => {
  if (!jti || !isRedisAvailable()) return false;
  try {
    const exists = await redisClient.exists("denylist:" + jti);
    return exists === 1;
  } catch { return false; }
};

/**
 * Strict authentication � rejects requests with no or invalid token.
 * Also checks Redis denylist for revoked tokens (logout support).
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this token has been explicitly revoked (e.g. via logout)
    if (await isTokenRevoked(decoded.jti)) {
      return res.status(401).json({ error: "Token has been revoked. Please log in again." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

/**
 * Optional authentication � attaches user to req if a valid token is present,
 * but does not block the request if missing or invalid.
 */
export const optionalAuthToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!await isTokenRevoked(decoded.jti)) {
        req.user = decoded;
      }
    } catch { /* ignore in optional mode */ }
  }
  next();
};
