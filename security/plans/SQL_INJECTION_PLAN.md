# SQL_INJECTION Fix Plan

## Changes

- None required — the codebase is already fully parameterized.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [x] Every `pg` query binds user values via `$N` placeholders
- [x] Dynamic identifiers (columns, `INTERVAL`) come from fixed allowlists
- [x] No `$queryRaw`/`$executeRaw`/`*Unsafe` Prisma calls
- [x] `grep -rnE "query\(.*\\\$\{" backend/src` returns nothing

## Manual verification (for the human)

- On code review of any new endpoint, confirm identifiers are allowlisted and values are
  bound, per the rule above.
- Optional: run the app with a tool such as `sqlmap` against an authenticated endpoint to
  confirm no injection (the parameterized shape makes this a no-op).
