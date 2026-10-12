# ERROR_HANDLING Fix Plan

## Changes

- `backend/src/utils/httpError.js` — **new** `serverError(res, err, context)` helper:
  logs the full error (stack) server-side and returns
  `{ success: false, error: 'Internal server error.' }`.
- `backend/src/controllers/submissions.controller.js` — 1 leaking response replaced.
- `backend/src/controllers/admin.controller.js` — 4 leaking responses replaced.
- `backend/src/controllers/colleges.controller.js` — 6 leaking responses replaced.
- `backend/src/controllers/candidates.controller.js` — 8 leaking responses replaced.
- `backend/src/controllers/questions.controller.js` — 4 leaking responses replaced.
- `backend/src/controllers/assessments.controller.js` — 8 leaking responses replaced.
- `backend/src/controllers/sectionsAttempts.controller.js` — 7 leaking responses replaced.

## New files

- `backend/src/utils/httpError.js`

## Verification goals

After implementation, ALL of these must be true:

- [x] No `error: err.message` / `error: err` in any response
- [x] All 38 unexpected-error responses return a generic message
- [x] Full error detail (stack) is logged server-side only
- [x] Global 404 + error handlers still return generic bodies
- [x] `node --check` passes on every changed file
- [x] Triggering a DB error (e.g. malformed admin filter) returns
      `{"success":false,"error":"Internal server error."}` with no SQL/table names

## Manual verification (for the human)

- Force a 500 (e.g. temporarily point `DATABASE_URL` at an unreachable host, or send an
  input that trips a constraint) and confirm the response body is the generic message
  while the server console shows the full error.
- Confirm `/api/unknown-route` still returns `{"error":"API endpoint not found."}`.
