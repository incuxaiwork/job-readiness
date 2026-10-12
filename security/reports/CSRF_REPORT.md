# CSRF Security Report

## Status: PASS (with hardening)

## Findings

### 1. Access tokens are header-based, not cookie-based (PASS)
Every authenticated API call uses `Authorization: Bearer <accessToken>`
(`frontend/src/services/api.js:23-26`), and `authenticateToken` reads the token from the
`Authorization` header (`middleware/auth.js:22-23`). A cross-site HTML form / image /
`fetch` cannot attach that header, so state-changing endpoints (POST/PUT/PATCH/DELETE on
candidates, assessments, attempts, submissions, questions, admin, code, interview) are
not CSRF-able.

### 2. Refresh cookie is correctly hardened (PASS)
`refreshCookieOpts()` (`auth.controller.js:79-85`):
```js
httpOnly: true,
secure: process.env.NODE_ENV === "production",
sameSite: process.env.REFRESH_COOKIE_SAMESITE || (production ? "Strict" : "Lax"),
path: "/api/auth",
```
- `httpOnly` -> not readable by JS.
- `secure` in production -> not sent over plaintext.
- `sameSite` defaults to **Strict** in production and **Lax** in development, both of
  which block cross-site POSTs to `/api/auth/refresh` and `/api/auth/logout`.
- `path: /api/auth` -> the cookie is only sent to the auth router, shrinking its attack
  surface.

### 3. Split-domain deploy caveat (addressed)
`.env.example` notes that a split-domain deploy must set
`REFRESH_COOKIE_SAMESITE=none` so the browser sends the HttpOnly cookie to the API
cross-site. `SameSite=None` removes the SameSite CSRF defense for the cookie endpoints.
Added `originGuard` (`middleware/originGuard.js`), applied to `POST /api/auth/refresh`
and `POST /api/auth/logout`, which rejects requests whose `Origin` is neither the same
origin, an allowlisted `CORS_ORIGIN`, nor a dev localhost origin. Non-browser clients
(no `Origin`) are unaffected.

### 4. No CSRF tokens (not required)
Because access tokens are header-based and the only cookie endpoints now have an origin
check, dedicated CSRF tokens are unnecessary. They would be required only if session
auth moved into a cookie.

### 5. Login CSRF (LOW)
`POST /auth/login` sets the refresh cookie. With SameSite=Lax/Strict a cross-site login
cannot carry an existing session, and with SameSite=None the new `originGuard` does not
(yet) cover the login routes. Impact is low (attacker logs a victim into the attacker's
own account) and requires the split-domain `none` configuration. Recommended follow-up:
extend `originGuard` to the login routes if `none` is used in production.

## What's at risk

- With no SameSite protection (split-domain `none`) and before this fix, an attacker page
  could trigger refreshes/logouts. No token theft is possible (responses are unreadable
  cross-origin under the CORS allowlist), but it is undesirable state tampering.

## What's already secure

- Header-based bearer auth (CSRF-immune) for all data endpoints.
- HttpOnly + Secure + SameSite cookies with a narrow path.
- CORS allowlist (no wildcard, credentials only with explicit origins).
- New explicit Origin check on the cookie endpoints.

## Recommendations (priority order)

1. Keep `SameSite=Strict` (or `Lax`) wherever the deploy allows it; prefer it over
   `none`. *(documented)*
2. Add `originGuard` to `/auth/refresh` and `/auth/logout`. *(done)*
3. If a split-domain `none` deploy is used, also apply `originGuard` to the login routes.
