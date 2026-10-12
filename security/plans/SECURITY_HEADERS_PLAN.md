# SECURITY_HEADERS Fix Plan

## Changes

- `frontend/server.mjs` — add a single `setSecurityHeaders(res)` applied to every
  response: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options: DENY,
  X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin (plus
  Cross-Origin-Opener-Policy and X-Permitted-Cross-Domain-Policies).

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [ ] `frontend/server.mjs` sets all five required headers on every response
- [ ] Headers are set in a single function, not per-route
- [ ] Backend keeps helmet as a single global middleware (already true)
- [ ] `node --check frontend/server.mjs` passes
- [ ] CSP in `server.mjs` mirrors the backend allowlist (jsDelivr, cdnjs, Google Fonts,
      Judge0)

## Manual verification (for the human)

- Run `PORT=4173 node frontend/server.mjs` and `curl -sI http://localhost:4173/`; confirm
  the five headers are present.
- Confirm the SPA still loads its CDN-hosted assets under the new CSP (no CSP violations
  in the browser console).
