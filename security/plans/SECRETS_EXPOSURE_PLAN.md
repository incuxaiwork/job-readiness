# SECRETS_EXPOSURE Fix Plan

## Changes

- `backend/src/config/secrets.js` (new) — central secret loader: `JWT_SECRET`
  (required, throws if unset), `REFRESH_SECRET`, and `getMasterPasswords()` /
  `isMasterPassword()` driven by `EMERGENCY_ADMIN_PASSWORDS` (empty by default).
- `backend/src/controllers/auth.controller.js` — delete the hardcoded JWT fallback
  and the `EMERGENCY_MASTER_PASSWORDS` constant; import `JWT_SECRET` and
  `isMasterPassword` from the config module.
- `backend/src/middleware/auth.js` — import the shared `JWT_SECRET` instead of
  reading `process.env.JWT_SECRET` directly, so both paths agree and fail fast.
- `backend/scripts/verify_candidate_deletion.js` — read admin creds from
  `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`.
- `backend/scripts/verify_reset_attempt.js` — read admin password from
  `TEST_ADMIN_PASSWORD`.
- `backend/scripts/verify_single_attempt.js` — read admin creds from env.
- `backend/scripts/verify_security_fixes.js` — read admin creds from env.
- `backend/scripts/create_database.js` — read DB password/host/user from
  `PGPASSWORD` / `PGHOST` / `PGUSER` with non-secret local defaults.
- `backend/.env.example` — document `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`,
  `EMERGENCY_ADMIN_PASSWORDS` (blank), and DB vars with placeholders.

## New files

- `backend/src/config/secrets.js`

## Verification goals

After implementation, ALL of these must be true:

- [x] `git ls-files .env` returns nothing
- [x] `grep -rn` across tracked source for `incuxai_readysetjob_secret_key`,
      `Admin@2026`, `Admin@123`, `Vishnu@18`, `sk_live_`, `sk_test_`, `AKIA`
      returns nothing
- [x] No env var prefixed with `NEXT_PUBLIC_`, `VITE_`, or `REACT_APP_` holds a
      secret key
- [x] `.env.example` exists with placeholder values only
- [x] Backend starts with `JWT_SECRET` set; throws a clear error when it is unset
- [x] With `EMERGENCY_ADMIN_PASSWORDS` unset, `isMasterPassword('Admin@2026')` is
      `false` (no backdoor)
- [x] Refresh-token signing still works (secret derived once, shared)
- [x] `node --check` passes on every changed file

## Manual verification (for the human)

- Rotate the exposed credentials: set a new `JWT_SECRET`, change the
  `admin@readysetjob.com` password, and rotate the Railway PostgreSQL and Redis
  passwords (the values in `backend/.env` were surfaced during the audit).
- If emergency admin access is genuinely needed, set
  `EMERGENCY_ADMIN_PASSWORDS` to a strong, unique value in the server environment
  only — never in the repo.
- Confirm the app boots and login works with the rotated secret.
