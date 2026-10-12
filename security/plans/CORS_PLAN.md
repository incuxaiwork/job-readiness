# CORS Fix Plan

## Changes

- `backend/src/index.js` — in the `cors()` origin callback, replace
  `callback(new Error('Blocked by CORS security policy'))` with
  `callback(null, false)` plus a `console.warn` naming the blocked origin, so a
  disallowed origin yields a clean no-ACAO response instead of a 500.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [ ] No `origin: '*'` or `origin: true` anywhere in the codebase
- [ ] `credentials: true` is only paired with the explicit allowlist callback
- [ ] A request with a disallowed `Origin` returns no `Access-Control-Allow-Origin` and
      does **not** return HTTP 500
- [ ] A request with an allowlisted `Origin` returns
      `Access-Control-Allow-Origin: <origin>` and `Access-Control-Allow-Credentials: true`
- [ ] `Vary: Origin` present on responses

## Manual verification (for the human)

- With the server running, `curl -sI -H 'Origin: https://evil.example' http://localhost:5000/api/health`
  -> no `Access-Control-Allow-Origin` header.
- `curl -sI -H 'Origin: http://localhost:5173' http://localhost:5000/api/health`
  -> `Access-Control-Allow-Origin: http://localhost:5173` and
  `Access-Control-Allow-Credentials: true`.
