# Security Audit Summary

Date: 2026-10-12

Audit performed against `job-readiness` (Node/Express + `pg`/Prisma/PostgreSQL backend,
React/Vite frontend) following `AI-CHECKLIST.MD`. All 17 categories have a report in
`security/reports/` and a plan in `security/plans/`.

## Results

| # | Category | Status | Report | Plan |
|---|----------|--------|--------|------|
| 1 | SECRETS_EXPOSURE | CRITICAL (remediated, rotation pending) | [report](reports/SECRETS_EXPOSURE_REPORT.md) | [plan](plans/SECRETS_EXPOSURE_PLAN.md) |
| 2 | DATABASE_ACCESS | HIGH (TLS fixed; RLS pending) | [report](reports/DATABASE_ACCESS_REPORT.md) | [plan](plans/DATABASE_ACCESS_PLAN.md) |
| 3 | AUTH_MIDDLEWARE | HIGH (remediated) | [report](reports/AUTH_MIDDLEWARE_REPORT.md) | [plan](plans/AUTH_MIDDLEWARE_PLAN.md) |
| 4 | ACCESS_CONTROL | MEDIUM (remediated) | [report](reports/ACCESS_CONTROL_REPORT.md) | [plan](plans/ACCESS_CONTROL_PLAN.md) |
| 5 | FRONTEND_SECRETS | MEDIUM (remediated) | [report](reports/FRONTEND_SECRETS_REPORT.md) | [plan](plans/FRONTEND_SECRETS_PLAN.md) |
| 6 | SSRF | PASS | [report](reports/SSRF_REPORT.md) | [plan](plans/SSRF_PLAN.md) |
| 7 | CSRF | PASS (with hardening) | [report](reports/CSRF_REPORT.md) | [plan](plans/CSRF_PLAN.md) |
| 8 | SECURITY_HEADERS | MEDIUM (remediated) | [report](reports/SECURITY_HEADERS_REPORT.md) | [plan](plans/SECURITY_HEADERS_PLAN.md) |
| 9 | CORS | PASS (with minor hardening) | [report](reports/CORS_REPORT.md) | [plan](plans/CORS_PLAN.md) |
| 10 | RATE_LIMITING | MEDIUM (remediated) | [report](reports/RATE_LIMITING_REPORT.md) | [plan](plans/RATE_LIMITING_PLAN.md) |
| 11 | SQL_INJECTION | PASS | [report](reports/SQL_INJECTION_REPORT.md) | [plan](plans/SQL_INJECTION_PLAN.md) |
| 12 | XSS | PASS | [report](reports/XSS_REPORT.md) | [plan](plans/XSS_PLAN.md) |
| 13 | PAYMENT_WEBHOOKS | N/A | [report](reports/PAYMENT_WEBHOOKS_REPORT.md) | [plan](plans/PAYMENT_WEBHOOKS_PLAN.md) |
| 14 | FILE_UPLOADS | N/A (no server-side uploads) | [report](reports/FILE_UPLOADS_REPORT.md) | [plan](plans/FILE_UPLOADS_PLAN.md) |
| 15 | ERROR_HANDLING | HIGH (remediated) | [report](reports/ERROR_HANDLING_REPORT.md) | [plan](plans/ERROR_HANDLING_PLAN.md) |
| 16 | PASSWORD_HASHING | PASS | [report](reports/PASSWORD_HASHING_REPORT.md) | [plan](plans/PASSWORD_HASHING_PLAN.md) |
| 17 | DEPENDENCIES | HIGH (backlog reduced; residual runtime risk) | [report](reports/DEPENDENCIES_REPORT.md) | [plan](plans/DEPENDENCIES_PLAN.md) |

Tally: 5 PASS, 1 N/A + 1 N/A, 5 remediated (MEDIUM/HIGH), and 3 with outstanding work
(1 CRITICAL, 2 HIGH).

## Critical issues

**1. SECRETS_EXPOSURE (CRITICAL).** The code contained multiple authentication bypasses:
- A hardcoded JWT signing-secret fallback (`incuxai_readysetjob_secret_key_2026_jwt_auth`)
  used if `JWT_SECRET` was unset, allowing token forgery.
- A hardcoded emergency master-password list (`Admin@2026`, `Admin@123`, `admin`) that
  granted super-admin access, including when `bcrypt.compare` failed.
- A universal candidate password bypass (`Password@123`/`Vishnu@18`).
- Live admin credentials (`admin@readysetjob.com` / `Admin@2026`) and a DB password
  committed in tracked verification scripts.
- The seed routine reset the admin password to `Admin@2026` on every run.

All hardcoded secrets/backdoors have been removed and centralized
(`backend/src/config/secrets.js` throws when `JWT_SECRET` is missing; emergency master
passwords are opt-in via `EMERGENCY_ADMIN_PASSWORDS`, empty by default). **Immediate
remaining action: rotate the exposed admin password, `JWT_SECRET`, and the Railway
PostgreSQL/Redis credentials** — those values must be considered compromised.

## Remaining manual verification

Actions a human must still perform (from the plans):

- **Rotate credentials (SECRETS_EXPOSURE):** admin password, `JWT_SECRET`, and Railway
  PostgreSQL + Redis passwords.
- **Apply RLS / least privilege (DATABASE_ACCESS):** run `npm run db:rls` against the live
  database, and adopt a dedicated non-superuser application role for the backend.
- **Confirm deployments pick up:** TLS verification for the production DB, the
  `TRUST_PROXY` value, and the hardened `frontend/server.mjs` security headers.
- **DEPENDENCIES follow-ups:** upgrade `pdfjs-dist` to a patched major (reachable via
  resume parsing), replace `xlsx` with the SheetJS CDN build (≥0.20.3), and bump the
  `vite`/`tailwindcss` build toolchain; re-verify the PDF and Excel flows end-to-end.
- **Smoke-test the app** after the ERROR_HANDLING change: force a 500 and confirm the
  response is `{"success":false,"error":"Internal server error."}` with full detail only
  in server logs.
