# PASSWORD_HASHING Security Report

## Status: PASS

## Findings

### 1. All passwords use bcrypt (PASS)
The app uses `bcryptjs` for every password operation; no other algorithm touches password
material.

| Location | Operation | Cost |
|---|---|---|
| `auth.controller.js:195` | candidate register — `bcrypt.hash(password, BCRYPT_SALT_ROUNDS)` | 10 (default) |
| `auth.controller.js:413` | candidate login — `bcrypt.compare` | — |
| `auth.controller.js:549` | admin login — `bcrypt.compare` | — |
| `colleges.controller.js:147` | college-admin create — `bcrypt.hash(tempPassword, 10)` | 10 |
| `colleges.controller.js:181` | college-admin password update — `bcrypt.hash(..., 10)` | 10 |
| `db/schema.js:494` | seed admin — `bcrypt.hash(seedAdminPassword, 10)` | 10 |

`BCRYPT_SALT_ROUNDS` defaults to `10` and is configurable via env
(`auth.controller.js:22`), a reasonable work factor.

### 2. No weak hashing of passwords (PASS)
`grep -rniE "md5|sha1|sha256|createHash" backend/src` yields a single hit:
`codeExecutionService.js:369-372`, which hashes `language:sourceCode:stdin` into a
**Redis cache key** for code-execution results. It is not password material and is not
stored as a credential. No MD5/SHA-1/SHA-256 is used anywhere for passwords, and auth is
not delegated to a third-party provider (so the N/A clause does not apply).

### 3. Password strength is enforced at registration (PASS)
`validatePassword` (`auth.controller.js:56-64`) requires ≥8 chars, ≥1 digit, and ≥1
special character before hashing. College-admin creation enforces ≥8 chars
(`colleges.controller.js:137,180`).

### 4. Existing hashes remain verifiable (PASS)
Login always uses `bcrypt.compare` against the stored `password_hash`; there is no legacy
plaintext or fast-hash path. Migration to a stronger cost is possible by rehashing on
successful login (not currently implemented; optional).

## What's at risk

Nothing material. Residual: bcrypt cost is env-tunable and could be lowered operationally;
enforce a minimum in config if desired.

## What's already secure

- bcrypt (blowfish-based, salted) for all credential hashing and verification.
- Cost factor 10 by default.
- Minimum password-complexity validation before hashing.
- No fast-hash or plaintext password storage; no legacy SHA/MD5 path.

## Recommendations (priority order)

1. No change required.
2. Optionally raise `BCRYPT_SALT_ROUNDS` toward 12 and rehash on next successful login.
3. Keep the rule that password material is only ever handled by bcrypt/Argon2/scrypt.

## Verification (implemented)

- Every `bcrypt.hash`/`bcrypt.compare` call site enumerated above.
- `createHash` appears only in a non-credential cache-key computation.
- `validatePassword` present and called in `register`.
