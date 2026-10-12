# SECRETS_EXPOSURE Security Report

## Status: CRITICAL

## Findings

### 1. Hardcoded JWT signing secret fallback (CRITICAL)
`backend/src/controllers/auth.controller.js:20`
```js
const JWT_SECRET = process.env.JWT_SECRET || 'incuxai_readysetjob_secret_key_2026_jwt_auth';
```
If `JWT_SECRET` is ever unset or misconfigured in any environment, every access and
refresh token is signed and verified with the publicly-visible constant
`incuxai_readysetjob_secret_key_2026_jwt_auth`. The refresh secret is even derived
predictably: `JWT_SECRET + "_refresh"` (`auth.controller.js:80,647`).

The auth middleware, by contrast, reads `process.env.JWT_SECRET` directly
(`backend/src/middleware/auth.js:30,54`) with no fallback, so the two code paths
disagree: a deployment missing the env var both *accepts forged tokens* (controller
path) and *breaks verification* (middleware path). Inconsistent, unsafe.

### 2. Hardcoded emergency master passwords = backdoor (CRITICAL)
`backend/src/controllers/auth.controller.js:28`
```js
const EMERGENCY_MASTER_PASSWORDS = ["Admin@2026", "Admin@123", "admin"];
```
Used at three call sites:
- `loginAdmin` when the DB is unreachable (`:533-540`): any email + one of these
  three public passwords returns a full **super-admin** token.
- `loginAdmin` when the DB is reachable (`:558`): for an existing super-admin
  account, a matching master password is accepted **even when `bcrypt.compare`
  fails** — i.e. real admin passwords are bypassable.
- `login` (`:610-612`): same emergency path.

`Admin@2026` is also the live production admin password recorded in the untracked
`test_txt` and echoed throughout the tracked verification scripts. Anyone reading
the source has full platform admin access.

### 3. Real credentials committed in tracked scripts (CRITICAL)
`git tracked` files contain live admin credentials and a DB password:
```
backend/scripts/verify_candidate_deletion.js:26,117   email: 'admin@readysetjob.com', password: 'Admin@2026'
backend/scripts/verify_reset_attempt.js:105           password: 'Admin@2026'
backend/scripts/verify_single_attempt.js:107          password: 'Admin@2026'
backend/scripts/verify_security_fixes.js:42           email: 'admin@readysetjob.com', password: 'Admin@2026'
backend/scripts/create_database.js:6                  password: 'Vishnu@18'
```
`admin@readysetjob.com` / `Admin@2026` matches the live admin account. These are in
git history and pushed to the remote.

### 4. Default/seed passwords in tracked scripts (HIGH)
`backend/scripts/seed_candidates.js:7` and many verify scripts use
`Password@123` for candidate accounts. Predictable seed password; acceptable for
local fixtures but it should be env-driven and documented, not a magic constant.

### 5. Production `.env` holds live infrastructure secrets (INFO — handled)
`backend/.env` contains the real Railway PostgreSQL URL, Redis URL and JWT secret.
It is **not** tracked (`git ls-files .env` is empty) and `.env` / `.env.*` are in
`.gitignore`, and `git log --all -- '**/.env'` shows no history. So the file was
never committed — good — but the values were surfaced during this audit and should
be rotated if this workspace or transcript is ever shared. The DB/Redis passwords
and JWT secret should be treated as exposed until rotated.

### 6. Frontend env usage (PASS)
`frontend/.env` only defines `VITE_API_URL=/api`, an empty
`VITE_ELEVENLABS_API_KEY`, and a public voice id. No secret value is placed behind a
`VITE_` prefix. `frontend/src/pages/candidate/AIMockInterviewPage.jsx:547` reads the
ElevenLabs key from `import.meta.env` and the file itself warns not to put secrets
there. `.env.example` files contain placeholders only.

### 7. `.gitignore` / tracking (PASS)
`.env`, `.env.*` (except `.env.example`), `uploads/`, `*.log`, and `test_txt` are
ignored. No `.env` file is tracked or present in git history. `.env.example` files
contain placeholders only.

## What's at risk

- **Total authentication bypass**: forging an admin JWT with the hardcoded secret if
  `JWT_SECRET` is unset, or logging in as super-admin with `Admin@2026`.
- **Full tenant/data compromise**: super-admin can read/modify every candidate,
  assessment, submission and college.
- **Credential stuffing**: the committed `admin@readysetjob.com` / `Admin@2026` pair
  is a working production credential published in the repository.
- **Infrastructure compromise** if the real DB/Redis URLs are ever recovered (they
  are currently untracked, but exposed to anyone with filesystem/transcript access).

## What's already secure

- `.env` is gitignored, untracked, and absent from git history.
- No secret is placed behind `VITE_`/`NEXT_PUBLIC_`/`REACT_APP_`.
- `.env.example` files hold placeholders only.
- `test_txt` (live creds) is gitignored.
- The emergency-password code is at least gated on the master list rather than a
  blanket "DB down -> allow any login".

## Recommendations (priority order)

1. Remove the hardcoded JWT fallback; load `JWT_SECRET` from one central module that
   throws when it is missing, and use it in both the controller and middleware.
2. Remove the hardcoded `EMERGENCY_MASTER_PASSWORDS` array. Make emergency access
   opt-in via `EMERGENCY_ADMIN_PASSWORDS` (empty/disabled by default) and never
   honor it while the database is reachable.
3. Strip real credentials from tracked scripts; read them from env
   (`TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `PGPASSWORD`, …). Document the vars in
   `.env.example` with placeholders.
4. Rotate the exposed admin password, JWT secret, and Railway DB/Redis credentials.
5. Use an env-driven seed password instead of the `Password@123` constant.

## Additional findings discovered during implementation

While fixing the above, two more hardcoded-credential backdoors were found and removed:

- `backend/src/controllers/auth.controller.js:414` — candidate login had a universal
  password bypass: `if (!valid && (password === 'Password@123' || password === 'Vishnu@18')) { valid = true; }`.
  Any candidate account could be logged into with those two public strings. Removed.
- `backend/src/db/schema.js:491` — `initSchema()` hashed and **reset the admin password
  to `Admin@2026`** on every run (`ON CONFLICT … DO UPDATE SET password_hash`). Now
  driven by `SEED_ADMIN_PASSWORD` and skipped when unset (existing admin untouched).

## Verification (implemented)

All plan goals verified on 2026-10-12:

- `git ls-files .env` -> empty.
- `git grep` for `incuxai_readysetjob_secret_key|Admin@2026|Admin@123|Vishnu@18|sk_live_|sk_test_|AKIA`
  across `backend/` and `frontend/` -> no matches.
- `frontend/` has no secret behind a `VITE_`/`NEXT_PUBLIC_`/`REACT_APP_` prefix.
- New `backend/src/config/secrets.js` throws `JWT_SECRET is not set (or is too short)…`
  when the env var is empty, and loads the 68-char secret when present.
- `isMasterPassword('Admin@2026')` -> `false` by default; only true for values supplied
  via `EMERGENCY_ADMIN_PASSWORDS`.
- `REFRESH_SECRET === JWT_SECRET + '_refresh'`.
- `node --check` passes on all changed files.

Remaining manual action: rotate the exposed admin password, `JWT_SECRET`, and Railway
PostgreSQL/Redis credentials.
