# AUTH_MIDDLEWARE Security Report

## Status: HIGH (remediated)

## Findings

`authenticateToken` (`backend/src/middleware/auth.js`) rejects missing/invalid tokens
with 401 and is applied via `router.use(...)` before the handlers on most routers.
Two routers, however, used `optionalAuthToken` (attaches a user when present but never
blocks) or no middleware at all, leaving user-facing functionality and expensive
compute endpoints reachable without authentication.

### 1. Code execution endpoints were unauthenticated (HIGH)
`backend/src/routes/code.routes.js` used `optionalAuthToken` / no middleware:
```js
router.post('/run',    optionalAuthToken, …)   // arbitrary code execution
router.post('/submit', optionalAuthToken, …)   // enqueues evaluation jobs
router.get('/runs/logs', optionalAuthToken, …) // execution telemetry
router.get('/submissions/:jobId/stream', …)    // NO middleware at all
router.get('/submissions/:jobId/status', …)    // NO middleware at all
```
Anyone on the internet could execute arbitrary code (CPU/resource abuse, and a pivot
toward the code-execution backend) and read submission results by job id. BullMQ job
ids are sequential, so `/submissions/:jobId/status` was enumerable.

### 2. Interview session endpoints used optional auth (HIGH)
`backend/src/routes/interview.routes.js` applied `optionalAuthToken` to the whole
router, so `GET /session/:id`, `/questions`, `/analysis`, `POST /telemetry`,
`/complete`, `POST /question/:id/answer` and `POST /analyze-frame` were reachable
without a token. The controller's `sessionAccessDenied()` returns *allow* for sessions
with no `userId` (guest/unattributed), so any guest session was readable/writable by
id. `POST /analyze-frame` (image/pose processing) was also open to anonymous CPU abuse.

### 3. Admin endpoints were still safe (PASS)
`requireRole` (`rbac.js:1-11`) returns **401** when `req.user` is missing and **403**
on role mismatch, so `/api/interview/admin/sessions`, `/api/interview/admin/settings`
and every `/api/admin/*` route stayed protected even under `optionalAuthToken`.

### 4. Answer keys are not leaked (PASS)
`questions.controller.js:39-45` and `assessments.controller.js`'s `getAssessmentQuestions`
conditionally include `correct_answer`/`explanation` only when `req.user.role === 'admin'`.
Candidates authenticated on `GET /questions` and `GET /assessments/:id/questions` do not
receive answer keys.

### Full route inventory

| Router | Method + path | Middleware | Status |
|---|---|---|---|
| auth | POST /register | registerLimiter | public (by design) |
| auth | POST /login, /admin/login | loginLimiter | public (by design) |
| auth | POST /logout, /refresh | – | public (self/cookie) |
| auth | GET /me | authenticateToken | protected |
| candidates | GET /company-eligibility/criteria | – | public catalog |
| candidates | GET / | authenticateToken + requireRole(admin,college_admin) | protected |
| candidates | DELETE /:id, POST /:id/reset-attempt | + requireRole(admin) | admin |
| candidates | GET /:id, GET /:id/submissions | + requireCandidateReadAccess | owner/scoped |
| candidates | PUT /:id, /:id/academic-marks | + requireSelfOrAdmin | owner/admin |
| assessments | all | authenticateToken (admin on mutations) | protected |
| attempts | all | authenticateToken (+ controller ownership) | protected |
| questions | GET / | authenticateToken (no answer key for non-admin) | protected |
| questions | POST/PUT/DELETE | requireRole(admin) | admin |
| submissions | POST /, GET /my, POST /proctoring-event | authenticateToken | protected |
| submissions | GET /proctoring-events/:attemptId | + candidateReadAccess | owner/scoped |
| submissions | GET / | requireRole(admin) | admin |
| admin | all | authenticateToken + requireRole(admin,college_admin) | protected |
| admin | /colleges* | + requireRole(admin) | super-admin |
| code | GET /languages | – | public metadata |
| code | GET /runs/logs, POST /run, POST /submit | **authenticateToken (fixed)** | protected |
| code | GET /submissions/:jobId/stream, /status | **authenticateToken + job ownership (fixed)** | protected |
| interview | GET /settings | – | public config |
| interview | POST /session, GET /session/*, POST /question/:id/answer, POST /analyze-frame | **authenticateToken (fixed)** | protected |
| interview | GET /admin/sessions, POST /admin/settings | requireRole(admin) | super-admin |

## What's at risk

- **Unauthenticated arbitrary code execution** on the Judge0/Piston backend (resource
  abuse, denial of service, abuse of the paid execution quota).
- **IDOR/enumeration of submission results** via sequential job ids.
- **Interview session disclosure/tampering**: reading a candidate's answers, analysis
  and telemetry, or completing another session, by id.
- **Anonymous CPU abuse** via the frame-analysis endpoint.

## What's already secure

- `authenticateToken` runs before handlers and returns 401 on missing/invalid tokens.
- `requireRole` returns 401 (no user) / 403 (wrong role) for admin surfaces.
- Ownership middleware (`ownership.js`) and controller ownership checks guard
  candidate and attempt resources.
- Answer keys are withheld from non-admin question responses.
- Refresh token lives in an HttpOnly cookie; access tokens carry `jti` for revocation.

## Recommendations (priority order)

1. Require authentication on all `/api/code/*` execution and result endpoints, and
   bind submission results to the requesting user. *(done)*
2. Require authentication on interview session read/write endpoints; keep only
   non-sensitive settings public; attribute sessions to `req.user.id`, ignoring any
   client-supplied `userId`. *(done)*
3. Keep the SSE stream authenticated (the frontend EventSource gracefully falls back
   to the authenticated polling endpoint on 401). *(done)*
4. Follow-up (ACCESS_CONTROL): verify attempt endpoints enforce attempt ownership
   against `req.user.id`.
