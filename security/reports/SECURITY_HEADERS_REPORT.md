# SECURITY_HEADERS Security Report

## Status: MEDIUM (remediated)

## Findings

### 1. Backend sets all required headers globally (PASS)
`backend/src/index.js:41-69` applies `helmet` once, before every route and before the
static SPA middleware, so the API and the production-served SPA both receive:

| Header | Value | Source |
|---|---|---|
| Content-Security-Policy | custom directive set | `helmet.contentSecurityPolicy` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | `helmet.strictTransportSecurity` |
| X-Frame-Options | `DENY` | `frameguard: { action: 'deny' }` |
| X-Content-Type-Options | `nosniff` | `noSniff: true` |
| Referrer-Policy | `strict-origin-when-cross-origin` | `referrerPolicy` |

The CSP is deliberately strict: `default-src 'self'`, `object-src 'none'`,
`frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, with an explicit
allowlist of the CDNs actually used (jsDelivr/MediaPipe, cdnjs/pdf.js, Google Fonts,
Judge0). `unsafe-inline` for scripts is required by the Vite/React bootstrap; this weakens
CSP's XSS mitigation but is a known Vite production constraint.

### 2. Standalone frontend server ships NO security headers (MEDIUM) — FIXED
`frontend/server.mjs` is the separate Railway frontend service (`npm start`), and its
`http.createServer` handler set only `Content-Type` and `Cache-Control`
(`server.mjs:45-47`). It served every HTML/JS/CSS response with **none** of the five
headers: no CSP, no HSTS, no X-Frame-Options, no nosniff, no Referrer-Policy. This is the
public entry point for the SPA, so the missing headers applied to real user traffic.

Fixed: `server.mjs` now sets all five headers (plus `X-Permitted-Cross-Domain-Policies`,
`Cross-Origin-Opener-Policy`) on every response through a single `setSecurityHeaders()`
applied at the top of the request handler, with a CSP matching the backend's allowlist.

### 3. HSTS only meaningful over HTTPS (INFO)
`Strict-Transport-Security` is sent unconditionally. Browsers ignore it over plaintext,
so this is harmless locally and correct behind Railway's TLS-terminating proxy.

## What's at risk

- (Before fix) The SPA could be framed cross-origin on the split-domain deploy (no
  `X-Frame-Options`/`frame-ancestors`), enabling clickjacking on login and assessment
  screens; MIME sniffing and referrer leakage were also unmitigated.
- (Residual) CSP `unsafe-inline` reduces defense-in-depth against XSS; the app has no
  raw-HTML sinks (see XSS report), so impact is bounded.

## What's already secure

- The backend applies all five headers once, globally, to API + SPA responses.
- CSP is a tight allowlist with `object-src 'none'` and `frame-ancestors 'none'`.
- HSTS includes `includeSubDomains` with a one-year max-age.

## Recommendations (priority order)

1. Add the five headers to `frontend/server.mjs`. *(done)*
2. Keep header configuration in exactly one place per service (helmet for the API,
   `setSecurityHeaders` for the static server); never per-route.
3. Optional follow-up: replace the Vite `unsafe-inline` requirement with a nonce/hash if
   the build pipeline allows it, and tighten `style-src`'s `unsafe-inline`.

## Verification (implemented)

- `server.mjs` sets `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy` on
  every response; `node --check frontend/server.mjs` passes.
- Backend `index.js` continues to apply helmet once, globally, before all routes.
- Both configuration sites are single, global middlewares (no per-route headers).
