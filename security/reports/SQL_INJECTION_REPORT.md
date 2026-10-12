# SQL_INJECTION Security Report

## Status: PASS

## Findings

Every database call in the backend uses either `pg` parameterized placeholders
(`$1, $2, …`) or Prisma's typed query API. There is **no** string concatenation, f-string,
`.format()`, or user-controlled value interpolated into SQL text.

### 1. All `pg` queries are parameterized (PASS)
`grep -rnE "query\(.*\\\$\{" backend/src` returns nothing: no value is ever interpolated
directly into a query string. Representative examples:
- `auth.controller.js:369-405` — login lookup with `[email.trim()]`.
- `questions.controller.js:50-55` — optional filters build placeholders only:
  ```js
  if (category)   { params.push(category);   sql += ` AND category=$${params.length}`; }
  if (difficulty) { params.push(difficulty); sql += ` AND difficulty=$${params.length}`; }
  if (topic)      { params.push(`%${topic}%`); sql += ` AND topic ILIKE $${params.length}`; }
  ```
  `.length` is a number derived from the params array, so the template literal only ever
  emits `$1`/`$2`/`$3` — the user value itself is bound, never inlined. The wildcard
  `%…%` for a LIKE is bound as a value, not concatenated into SQL.
- `admin.controller.js` — the analytics `whereClause` is assembled from a list of
  condition strings that each reference `$${params.length}` and push their value to
  `params`; the values are always bound.

### 2. Dynamic SQL identifiers come from fixed allowlists (PASS)
The only non-placeholder interpolations are column names and a numeric interval:
- `colleges.controller.js:74-101` — `UPDATE colleges SET ${updates.join(', ')}` where
  `updates` is built by iterating the hardcoded `fields = ['name','code','domain',…,
  'status']` array (`:70`). Unknown body keys are ignored; only `field = $N` fragments are
  emitted. `updateCollegeAdmin` (`:176-198`) is the same pattern with `password_hash`,
  `status`, `name`.
- `admin.controller.js:398-399` — `const days = { '7d': 7, '30d': 30, '90d': 90 }[req.query.dateRange];`
  then `INTERVAL '${days} days'`. `days` is a number from a fixed map or `undefined`, so
  the string can only ever be `7`, `30`, or `90` — not injectable.
- `questions.controller.js:44` — `${isAdmin ? 'correct_answer, explanation,' : ''}` is a
  fixed column list chosen by a boolean, not user text.

### 3. Prisma usage is parameterized (PASS)
`interview.controller.js` uses only Prisma model methods (`findUnique`, `findMany`,
`create`, `update`, `createMany`, `$transaction`). `grep` for
`$queryRaw`/`$executeRaw`/`$queryRawUnsafe`/`$executeRawUnsafe` returns nothing, so there
is no raw-SQL path in the interview module.

### 4. No ORM-adapter raw escape hatch (PASS)
`backend/src/db/prisma.js` builds a `PrismaClient` with the `@prisma/adapter-pg` adapter
but the codebase never calls raw/unsafe query methods.

### 5. `LIKE`/`ILIKE` wildcards are bound (PASS, note)
Search filters (`topic ILIKE`, email domain filters) bind the pattern as a parameter.
An attacker can still supply `%`/`_` to broaden their own search (LIKE metacharacters),
but that is a functional wildcard, not injection, and is scoped by auth/tenant filters.

## What's at risk

Nothing exploitable via SQL injection. The residual concern is future drift: a new route
that inlines a column name or a `LIMIT`/`INTERVAL` from request data directly into SQL
would reintroduce the class.

## What's already secure

- 100% parameterized `pg` queries; Prisma-only for interview data.
- No raw/unsafe Prisma escape hatches.
- Dynamic identifiers restricted to fixed allowlists; numeric INTERVAL from a fixed map.
- Server-side request validation upstream (e.g. college `code` regex) further reduces
  the value surface.

## Recommendations (priority order)

1. No code change required.
2. Keep the rule: identifiers (column/table/sort/interval) must come from a hardcoded
   allowlist; values must always be bound placeholders.
3. If a future feature needs user-chosen sort columns, map them through an allowlist
   object rather than interpolating the request string.

## Verification (implemented)

- `grep -rnE "query\(.*\\\$\{" backend/src` → no matches.
- `grep -rniE "queryRaw|executeRaw|queryRawUnsafe|executeRawUnsafe" backend/src` → no
  matches.
- All `${…}` occurrences in controllers are `$${params.length}` placeholder indices,
  allowlisted column names, or the fixed numeric `INTERVAL` map.
