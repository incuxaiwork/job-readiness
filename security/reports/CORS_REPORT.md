# CORS Security Report

## Status: PASS (with minor hardening)

## Findings

### 1. Explicit allowlist, no wildcard (PASS)
`backend/src/index.js:72-87`:
```js
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS security policy'));
    }
  },
  credentials: true,
}));
```
- Origin is an allowlist read from `CORS_ORIGIN`; there is **no** `origin: true`,
  `origin: '*'`, or request-origin reflection.
- `credentials: true` is only ever paired with the allowlist callback, never with a
  wildcard — satisfying the rule that forbids `origin: '*'` + `credentials: true`.
- Because `origin` is a function, the `cors` middleware emits `Vary: Origin`, so caches
  do not serve one tenant's ACAO to another.
- `!origin` (curl, mobile, server-to-server health checks) is allowed; this is standard
  and harmless because such clients do not enforce CORS and carry no session cookie
  automatically.

### 2. Negative path returned 500 instead of a clean block (LOW) — FIXED
A disallowed origin hit `callback(new Error(...))`, which propagated to the global error
handler and returned **HTTP 500** `Internal server error.` to the caller (and polluted
error logs with a client-caused event). Fixed: the callback now returns
`callback(null, false)`, the idiomatic CORS rejection. The request still completes without
`Access-Control-Allow-Origin`, so the browser blocks the response, and no 500 is emitted.
A server-side `console.warn` records the blocked origin for ops.

### 3. Dev localhost reflection is production-gated (PASS)
`origin.startsWith('http://localhost:')` is only accepted when
`NODE_ENV !== 'production'`, so arbitrary localhost ports cannot be allowlisted in prod.

## What's at risk

- Nothing material. Residual: an operator must remember to set `CORS_ORIGIN` to the real
  frontend origin(s) on a split-domain deploy; otherwise the default localhost list
  applies (fails closed — no unexpected origin is allowed).

## What's already secure

- No wildcard origin; no dynamic reflection of the request Origin.
- `credentials: true` gated behind the explicit allowlist.
- `Vary: Origin` emitted by the cors middleware.
- Dev-only localhost allowance cannot leak into production.

## Recommendations (priority order)

1. Return `callback(null, false)` on rejection rather than throwing. *(done)*
2. Always set `CORS_ORIGIN` explicitly in production (comma-separated, no wildcard).
3. Keep cookies `SameSite=Strict`/`Lax` so CORS is not the sole cross-site control.

## Verification (implemented)

- Disallowed origins no longer produce a 500; they receive a normal response with no
  `Access-Control-Allow-Origin`, which the browser blocks.
- `allowedOrigins` remains an explicit list; no `*` anywhere.
- `credentials: true` is still only reachable for allowlisted/same-origin requests.
- `node --check backend/src/index.js` passes.
