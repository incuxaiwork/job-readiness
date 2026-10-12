# DATABASE_ACCESS Security Report

## Status: HIGH

## Findings

### Stack note
This project is **not** Supabase or Firebase. It is a plain Node/Express backend using
the `pg` driver (`backend/src/db/pool.js`) and Prisma (`backend/prisma/schema.prisma`)
against a self-hosted PostgreSQL instance (Railway). There is **no anon key, no
PostgREST, no Firebase rules** — all database access is mediated server-side by the
backend. The checklist's RLS/anon-key checks are therefore evaluated against their
server-side equivalents (least privilege, transport security, defense-in-depth).

### 1. Row Level Security is not enabled on any table (MEDIUM)
`grep` for `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, or `ROW LEVEL SECURITY` across
`backend/src/db/schema.js` and `backend/prisma/schema.prisma` returns nothing. All 30+
tables (`users`, `candidates`, `candidate_profiles`, `assessments`, `questions`,
`submissions`, `assessment_submissions`, `interview_*`, `reports`, …) have **no RLS**.

Because the backend connects with a single privileged role, RLS is not currently
load-bearing for the app's own queries, but its absence removes all defense-in-depth:
anyone who obtains the DB credentials can read/write every row in every table.

### 2. TLS certificate validation disabled (HIGH)
`backend/src/db/pool.js:19`
```js
ssl: isLocalhost ? false : { rejectUnauthorized: false },
```
For any non-localhost connection (i.e. the production Railway DB reached over the public
proxy), the client accepts **any** TLS certificate. A network attacker able to MITM the
connection can impersonate the database server and capture the superuser credentials and
all query traffic.

### 3. Database reached as superuser over the public internet (HIGH)
`backend/.env` uses the `postgres` role and a public proxy URL
(`mainline.proxy.rlwy.net:56422`). Combined with finding #2 and #1, leaked or sniffed
credentials yield full control of every table with no second layer of protection.
`.env` is untracked (good) but this is the highest-value secret in the system.

### 4. No least-privilege application role (MEDIUM)
No `CREATE ROLE`, `GRANT`, or `REVOKE` statements exist in the schema or migrations. The
app runs as the database owner/superuser, so a SQL-injection or SSRF->DB pivot would have
unrestricted privileges (schema changes, `COPY`, file access where enabled).

### 5. Direct DB access is centralized (PASS)
All queries go through the shared `pool` (`backend/src/db/pool.js`) or Prisma; there are
no client-side/ browser database connections and no anon key shipping to the frontend.
No service-role key is exposed. Connection pooling, idle timeouts and error handlers are
configured (`pool.js:29-41`).

### 6. Schema constraints exist (PASS)
The schema defines primary keys, unique constraints (`users.email`,
`idx_submissions_cand_asm_unique`) and foreign-key style references, and dedupes legacy
rows before creating the unique index (`schema.js:476-486`).

## What's at risk

- **Full data breach / tampering**: with the DB credentials (or a MITM of the
  unvalidated TLS session), an attacker reads every candidate PII record, assessment,
  proctoring event and report, and can modify scores or delete data at will.
- **Lateral movement**: superuser access enables schema writes and, where `pg_read_server_files`
  is available, filesystem access on the DB host.
- **No containment**: because RLS is off, there is no way to limit a compromised session
  to a single tenant/college.

## What's already secure

- No Supabase/Firebase anon key or service-role key anywhere; DB access is server-only.
- `.env` with the DB URL is gitignored, untracked, and not in git history.
- The DB layer is centralized in one module, so hardening is a single-point change.
- Unique/foreign-key constraints limit the impact of logic bugs.

## Recommendations (priority order)

1. Re-enable TLS certificate validation (`rejectUnauthorized: true`), optionally pinning
   the provider CA via `DATABASE_SSL_CA`; never disable verification for a remote host.
2. Create a dedicated, least-privilege application role (DML on app tables only; no
   `SUPERUSER`, `CREATEDB`, `CREATEROLE`, no `pg_read_server_files`) and point the backend
   at it. Reserve the `postgres` superuser for migrations only.
3. Add RLS as defense-in-depth (see plan) or, if RLS is impractical for this
   connection model, document the compensating controls (single-tenant VPC, IP allowlist,
   rotated credentials) and restrict the public proxy endpoint.
4. Rotate the exposed PostgreSQL credential (associated with SECRETS_EXPOSURE finding #5).

## Verification (implemented)

- `backend/src/db/pool.js` no longer contains an unconditional
  `rejectUnauthorized: false`; remote TLS verification resolves to `true` by default
  (verified via a non-localhost connection-string check) and can be pinned with
  `DATABASE_SSL_CA`. Localhost still disables TLS.
- `backend/scripts/enable_rls.js` added (`npm run db:rls`); `--dry-run` emits the
  `ALTER TABLE … ENABLE ROW LEVEL SECURITY` statements for every public table.
- `node --check` passes on the changed files.

Pending manual step: apply `npm run db:rls` to the live database and adopt a
least-privilege application role (see plan).
