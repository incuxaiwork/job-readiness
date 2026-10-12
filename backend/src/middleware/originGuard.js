/**
 * Origin guard for cookie-authenticated, state-changing endpoints.
 *
 * Access tokens are sent in the Authorization header (not CSRF-able), but the refresh
 * token is an HttpOnly cookie. When a split-domain deploy sets
 * REFRESH_COOKIE_SAMESITE=none (required for cross-site cookies), SameSite no longer
 * defends those cookie endpoints, so we explicitly verify the request Origin.
 *
 * Allows: same-origin requests (Origin host === Host header), configured CORS origins,
 * localhost in development, and non-browser clients with no Origin header.
 */
export const originGuard = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const host = req.headers.host;
  let originHost = null;
  try { originHost = new URL(origin).host; } catch { originHost = null; }

  const sameOrigin = originHost && host && originHost === host;
  const allowlisted = allowedOrigins.includes(origin);
  const devLocalhost = process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:');

  if (sameOrigin || allowlisted || devLocalhost) return next();

  return res.status(403).json({ success: false, error: 'Request blocked by origin policy.' });
};
