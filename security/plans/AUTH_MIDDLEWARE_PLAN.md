# AUTH_MIDDLEWARE Fix Plan

## Changes

- `backend/src/routes/code.routes.js` — replace `optionalAuthToken` with
  `authenticateToken` on `/runs/logs`, `/run`, `/submit`; add `authenticateToken` to
  `/submissions/:jobId/stream` and `/submissions/:jobId/status`; add an ownership check
  (`job.clientKey === req.user.id`, admin exempt) on both.
- `backend/src/queues/submissionQueue.js` — return `clientKey` from `getJob()` (both the
  in-memory and BullMQ paths) so the route can enforce job ownership.
- `backend/src/routes/interview.routes.js` — keep `GET /settings` public; apply
  `authenticateToken` to the whole router for all other endpoints; keep admin routes on
  `requireRole('admin')`.
- `backend/src/controllers/interview.controller.js` — `createSession` attributes the
  session to `req.user.id` only (ignore client-supplied `userId`).

## New files

None.

## Verification goals

After implementation, ALL of these must be true:

- [x] No `/api/code/*` endpoint that executes code or returns results is reachable
      without a valid token
- [x] `GET /api/code/submissions/:jobId/{status,stream}` rejects a request for a job
      owned by another user with 403
- [x] No `optionalAuthToken` remains in `code.routes.js` or `interview.routes.js`
- [x] `GET /api/interview/settings` stays public; every other interview endpoint
      requires authentication
- [x] Interview sessions are attributed to `req.user.id` (body `userId` ignored)
- [x] Admin interview/admin routes still enforce `requireRole('admin')`
- [x] Unauthenticated requests to protected routes return 401 (via `authenticateToken`)
- [x] `node --check` passes on all changed files

## Manual verification (for the human)

- `curl -X POST /api/code/run` with no `Authorization` header -> expect 401.
- Log in as candidate A, submit code, then with candidate B's token request
  `/api/code/submissions/<A's jobId>/status` -> expect 403.
- `curl /api/interview/session/<id>` with no token -> expect 401.
- Confirm the interview and code-runner pages still work when logged in.
