# ACCESS_CONTROL Security Report

## Status: MEDIUM (remediated)

## Findings

Object-level authorization (BOLA/IDOR) was reviewed on every route that takes a
resource id in the path, query, or body, on both reads and writes.

### 1. Proctoring-events authorization used the wrong identifier (MEDIUM) — FIXED
`backend/src/routes/submissions.routes.js` guarded
`GET /api/submissions/proctoring-events/:attemptId` with
`candidateReadAccess('attemptId')`. That middleware (`ownership.js:77-89`) treats its
argument as a **candidate id** and compares it to `req.user.id` / looks up the
candidate's college — but the route param is a **test attempt id**, not a candidate id.
Consequences:
- A candidate could not read their own proctoring events (their `user.id` never equals
  an attempt id) -> functional bug.
- The controller's query `WHERE attempt_id = $1 OR candidate_id = $1` was reachable by a
  candidate only when passing **their own user id** in the attemptId slot — so no cross-
  tenant read in practice, but the guard did not actually validate attempt ownership.

Fixed: the route now requires only `authenticateToken`, and `getProctoringEvents`
(`submissions.controller.js:442-456`) enforces ownership inside the handler — platform
admin sees all, college admin is scoped to their college via `canReadCandidate`, and a
candidate sees only rows whose `candidate_id === req.user.id`.

### 2. Attempt endpoints enforce ownership (PASS)
`attempts.routes.js` (all `authenticateToken`) delegates to
`loadOwnedAttempt(attemptId, req.user.id)` (`sectionsAttempts.controller.js:394-401`),
which queries `WHERE ta.id = $1 AND ta.candidate_id = $2`. `saveAnswer`,
`completeSection`, `submitAssessmentAttempt` and `getAttemptStatus` all use it and return
404 when the attempt is not owned. Auth and ownership are separate checks.

### 3. Candidate resource ownership is enforced (PASS)
- `GET /candidates/:id` / `/:id/submissions` -> `requireCandidateReadAccess`
  (`ownership.js:28-43,77-89`) + a controller-level college check for college admins
  (`candidates.controller.js:166`).
- `PUT /candidates/:id` and `/:id/academic-marks` -> `requireSelfOrAdmin`
  (`ownership.js:49-70`).
- `DELETE /candidates/:id` and `POST /:id/reset-attempt` -> `requireRole('admin')`
  (platform super-admin only).
- List endpoints scope by tenant via `resolveCollegeScope` (`collegeScope.js`): a college
  admin is always locked to `user.college_id`; `collegeId` supplied by the client cannot
  widen scope. `getAllCandidates` applies `AND COALESCE(cp.college_id, u.college_id) = $1`.

### 4. Submission endpoints are self-scoped (PASS)
`POST /submissions` derives identity from the token for non-admins
(`submissions.controller.js:37-45`); `GET /submissions/my` filters by
`candidate_id = $1 OR email = $2`; `GET /submissions` is admin-only. `GET /code/...`
job reads were fixed in AUTH_MIDDLEWARE to compare `job.clientKey` to `req.user.id`.

### 5. Interview sessions are owner-scoped (PASS, after AUTH_MIDDLEWARE fix)
`interview.controller.js` calls `sessionAccessDenied(req, session.userId)` on every
session read/write (lines 170, 242, 252, 274, 320, 384, 553, 901, 916) via
`canReadCandidate`. Sessions are now attributed to `req.user.id`. *Note:* sessions with a
null `userId` (legacy guest sessions) remain readable by any authenticated user who knows
the random id; consider a backfill or admin-only rule.

### 6. No cross-candidate writes (PASS)
Candidate identity for submissions and proctoring events comes from the token
(`req.user.id`), never from the body, for non-admin callers.

## What's at risk

- (Before fix) Attempt-id ownership was not validated on the proctoring-events route, and
  the guard silently broke authorized reads.
- Tenant isolation depends entirely on `collegeScope`/ownership helpers being applied;
  any new route that forgets them would be an IDOR.

## What's already secure

- Ownership checks exist on candidate, attempt, submission, proctoring and interview
  resources, and are separate from authentication.
- College-admin scoping cannot be overridden by client-supplied `collegeId`.
- Platform-super-admin-only operations (delete, reset, college management) are gated by
  `requireRole('admin')`.

## Recommendations (priority order)

1. Replace the misused `candidateReadAccess('attemptId')` with the in-handler ownership
   check. *(done)*
2. Keep the pattern: every new `:id` route must pair `authenticateToken` with an
   ownership helper or an explicit in-handler scope check.
3. Prefer 403 (forbidden) over 404 for ownership failures where resource existence is
   not itself sensitive — currently attempts return 404 (acceptable, avoid info leak).
4. Backfill or admin-restrict legacy interview sessions with a null `userId`.
