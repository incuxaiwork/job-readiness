# PASSWORD_HASHING Fix Plan

## Changes

- None required — bcrypt is used everywhere, with salt rounds 10 and complexity
  validation.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [x] All password hash/verify operations use bcrypt
- [x] No MD5/SHA-1/SHA-256 on password material
- [x] Password complexity enforced before hashing
- [x] No legacy plaintext/fast-hash comparison path

## Manual verification (for the human)

- Optional: set `BCRYPT_SALT_ROUNDS=12` and confirm registration still succeeds and login
  latency is acceptable.
- Inspect `users.password_hash` in the DB: values start with `$2a$`/`$2b$` (bcrypt).
