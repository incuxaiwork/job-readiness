# DATABASE_ACCESS Fix Plan

## Changes

- `backend/src/db/pool.js` — replace `ssl: { rejectUnauthorized: false }` with a
  `buildSslConfig()` helper: localhost -> no TLS; remote -> TLS with
  `rejectUnauthorized: true` by default, optional CA pinning via `DATABASE_SSL_CA`,
  explicit opt-out only via `DATABASE_SSL_REJECT_UNAUTHORIZED=false`.
- `backend/.env.example` — document `DATABASE_SSL_REJECT_UNAUTHORIZED` (default
  `true`) and `DATABASE_SSL_CA`.
- `backend/package.json` — add `db:rls` script.

## New files

- `backend/scripts/enable_rls.js` — enables RLS (default-deny for non-owner roles) on
  every `public` table. Supports `--force` and `--dry-run`. Safe for the app because the
  connection role is the table owner and owners bypass RLS.

## Verification goals

After implementation, ALL of these must be true:

- [x] No source file contains `rejectUnauthorized: false` as an unconditional remote-DB
      setting
- [x] Remote DB TLS verification defaults to enabled (`true`) unless explicitly disabled
- [x] Localhost connections still skip TLS
- [x] `DATABASE_SSL_CA` can pin a CA certificate
- [x] `backend/scripts/enable_rls.js --dry-run` prints `ALTER TABLE … ENABLE ROW LEVEL SECURITY`
      for every public table and does not modify anything
- [x] `node --check` passes on changed files
- [ ] (manual) Run `npm run db:rls` against the production DB once, confirming the app
      still reads/writes normally (owner bypass) and a non-owner role is denied

## Manual verification (for the human)

- Run `cd backend && npm run db:rls` to apply RLS to the live database, then smoke-test
  admin/candidate flows to confirm no regression.
- Create a least-privilege app role and point `DATABASE_URL` at it (keep `postgres` for
  migrations only). Grant `SELECT/INSERT/UPDATE/DELETE` on app tables as needed.
- Confirm the connection still succeeds with `rejectUnauthorized: true`. If Railway's CA
  is not in Node's trust store, download it and set `DATABASE_SSL_CA` (do NOT fall back
  to `false`).
- Rotate the exposed PostgreSQL superuser password.
