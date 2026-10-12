# RATE_LIMITING Security Report

## Status: MEDIUM (remediated)

## Findings

### 1. Auth + sensitive endpoints are rate limited (PASS)
`backend/src/middleware/rateLimiter.js` builds limiters (Redis-backed when available,
in-memory otherwise) and `backend/src/index.js:93-97` binds them:

| Limiter | Window | Production max |
|---|---|---|
| `loginLimiter` | 15 min | 30 (dev 250) |
| `registerLimiter` | 1 hour | 15 (dev 100) |
| `apiLimiter` (all `/api`) | 15 min | 600 |
| `submissionLimiter` | 10 min | 40 |

All return **429** with a JSON body. Login is additionally protected by a Redis-backed
per-account lockout (`rateLimiter.js:60-96`): 10 failed attempts / 15 min →
`isAccountLockedOut` → 429 in `loginCandidate`/`loginAdmin` (auth.controller.js:303, 517).
There is no password-reset endpoint (password resets are an admin/CLI operation), so
"password reset must be rate limited" is N/A.

### 2. No `trust proxy` configuration → limiters mis-identify clients (MEDIUM) — FIXED
`grep` for `trust proxy` in `backend/src` returns nothing. Express therefore uses the
**socket remote address** for `req.ip`. On the production Railway deploy the app sits
behind a TLS-terminating reverse proxy, so every request appears to originate from the
proxy's IP:
- All users share a single rate-limit bucket → `loginLimiter` (30/15 min) and
  `apiLimiter` lock out *everyone* after a small burst, and the per-IP control no longer
  isolates abusers.
- `express-rate-limit@8` also emits `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` validation
  warnings when `X-Forwarded-For` is present but proxy trust is unconfigured.

Fixed: `backend/src/index.js` now sets `app.set('trust proxy', <hops>)`. The number of
trusted hops defaults to **1** in production (Railway's edge) and can be overridden with
the `TRUST_PROXY` env var (integer, or `false`). It is never set to the unsafe boolean
`true`; `true` is coerced to a single hop. This makes limiters key on the true client IP
while preventing a client from spoofing `X-Forwarded-For` to dodge a limit.

### 3. X-Forwarded-For fallback in the code-exec client key (LOW)
`code.routes.js:119` falls back to `req.headers['x-forwarded-for']` for the execution
lock/cooldown key. The prefixed `/run` and `/submit` routes require authentication, and
`getClientKey` prefers `req.user.id`, so the header path is only reachable by an
authenticated request that also omits a user id — practically unreachable. With
`trust proxy` correctly configured, `req.ip` is already reliable; the raw-header fallback
could be removed in a later cleanup.

## What's at risk

- (Before fix) A single abusive source behind the shared proxy IP could trip the global
  login/API limiter and deny service to legitimate users; conversely, per-IP limits did
  not actually isolate individual clients.
- (Before fix) Spoofing concerns are inverted: because XFF was ignored, direct clients
  could not spoof — but the deployment topology made the limit effectively global.

## What's already secure

- Every auth/sensitive endpoint has a limiter with a 429 handler.
- Login has a second, per-account lockout (10/15 min) layered on top of the per-IP limit.
- Limiters use a shared Redis store in multi-instance deployments, so limits are
  consistent across replicas.
- No password-reset endpoint exists to protect.

## Recommendations (priority order)

1. Configure `trust proxy` to the exact number of reverse proxies in front of the app.
   *(done — defaults to 1 in production, override via `TRUST_PROXY`)*
2. Never set `trust proxy` to `true`; always use a hop count or trusted subnet.
3. Keep the Redis store enabled in production so limits are shared across instances.
4. Optional: drop the raw `x-forwarded-for` fallback in `code.routes.js:119`.

## Verification (implemented)

- `app.set('trust proxy', …)` is present in `index.js`, defaults to 1 in production, and
  coerces `'true'` to 1 (never boolean `true`).
- Limiters still return 429; unauthenticated login bursts are limited.
- `node --check backend/src/index.js` passes.
