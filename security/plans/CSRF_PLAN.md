# CSRF Fix Plan

## Changes

- `backend/src/middleware/originGuard.js` (new) — rejects state-changing requests whose
  `Origin` header is not same-origin, allowlisted (`CORS_ORIGIN`), or a dev localhost
  origin (requests without `Origin`, e.g. curl, pass).
- `backend/src/routes/auth.routes.js` — apply `originGuard` to `POST /auth/refresh` and
  `POST /auth/logout` (the only cookie-authenticated state-changing endpoints).

## New files

- `backend/src/middleware/originGuard.js`

## Verification goals

After implementation, ALL of these must be true:

- [x] Session/refresh cookie sets `httpOnly`, `secure` (prod), and `SameSite` Lax/Strict
- [x] `POST /auth/refresh` and `POST /auth/logout` reject a disallowed cross-site Origin
      with 403
- [x] Same-origin and allowlisted origins still work
- [x] Requests without an `Origin` header (server-to-server, curl) still work
- [x] All data endpoints use Authorization bearer tokens (not cookies), so they are not
      CSRF-able
- [x] `node --check` passes on changed files

## Manual verification (for the human)

- From a different origin (e.g. a local HTML page), `fetch('https://api…/api/auth/refresh', {method:'POST', credentials:'include'})`
  → expect it to be blocked (403) / not to affect the session.
- Confirm normal login → refresh → logout still works from the app origin.
- If using a split-domain deploy (`SameSite=None`), also confirm login works and consider
  extending `originGuard` to the login routes.
