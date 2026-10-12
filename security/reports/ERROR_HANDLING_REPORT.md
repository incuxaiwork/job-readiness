# ERROR_HANDLING Security Report

## Status: HIGH (remediated)

## Findings

### 1. Raw `err.message` returned to clients from 38 catch blocks (HIGH) — FIXED
Every controller caught database/runtime errors and echoed the raw exception text
straight back to the caller, e.g.:
```js
} catch (err) {
  console.error('getAllCandidates error:', err.message);
  res.status(500).json({ error: err.message });          // candidates.controller.js
}
```
and in `admin.controller.js`, `colleges.controller.js`, `questions.controller.js`,
`assessments.controller.js`, `sectionsAttempts.controller.js`, `submissions.controller.js`
with the shape `{ success: false, error: err.message }`.

Because the backend uses raw `pg`, a thrown error's `message` frequently contains the
failing SQL, table/column names, constraint names, and sometimes values — e.g.
`duplicate key value violates unique constraint "users_email_key"`, syntax/relation errors
and, on connection failures, host/driver details. This handed attackers a live
schema/DB-error oracle on endpoints such as `/api/admin/stats`, `/api/candidates`,
`/api/questions`, `/api/assessments`, `/api/admin/colleges`, and `/api/submissions`.

Fixed: added `backend/src/utils/httpError.js` (`serverError(res, err, context)`) which
logs the full error server-side and returns the generic
`{ success: false, error: 'Internal server error.' }`. All 38 leaking responses were
replaced in the seven controllers.

### 2. Global handlers are otherwise correct (PASS)
`backend/src/index.js:167-173`:
```js
app.use((_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});
```
- A global 404 handler and a 4-arg global error handler exist and return generic bodies.
- `uncaughtException` / `unhandledRejection` are intercepted and logged to the server
  console only (`index.js:218-224`), never to a response.
- No `err.stack` is ever placed in a response (grep confirms).
- No development/debug error page is enabled; the error handler is custom in all
  environments.

### 3. Residual internal-message surfaces (LOW)
- `backend/src/routes/code.routes.js:373` returns `stderr: err.message` — this is the
  *user's own code-execution* stderr, which is intended output, not a server error.
- `backend/src/queues/submissionQueue.js:82-83` stores `job.error = err.message`; if the
  owner-scoped status endpoint ever surfaces it, it could echo an internal queue error.
  Owner-scoped and low impact; recommended to map to a generic reason.
- `backend/src/db/redis.js:44` uses `err.message` only for local branch detection.

## What's at risk

- (Before fix) Attackers could enumerate schema/table/constraint names and probe DB
  internals across many authenticated endpoints, materially easing SQL-injection and
  enumeration attempts.
- (Residual, low) A queue failure reason could be echoed to the owning candidate.

## What's already secure

- Global 404 + error handlers return generic messages.
- No stack traces or file paths in any response.
- Process-level exceptions caught and logged server-side only.
- Imported validation errors (400/403/404) already return explicit, non-internal text.

## Recommendations (priority order)

1. Replace all `err.message` responses with a generic message + server-side log. *(done)*
2. Keep the `serverError` helper as the single pattern for unexpected failures; use
   explicit safe strings for expected 4xx cases.
3. Map `submissionQueue` failure reasons to a generic client-facing value.

## Verification (implemented)

- `grep -rnE "error:\s*err\.message|error:\s*err\b|message:\s*err\.message|details:\s*err" backend/src`
  -> no matches.
- 38 call sites now use `serverError(res, err, <context>)`.
- `serverError` logs `err.stack` server-side and responds with `Internal server error.`
- `node --check` passes on all seven controllers and the helper.
