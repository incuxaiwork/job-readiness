# ACCESS_CONTROL Fix Plan

## Changes

- `backend/src/controllers/submissions.controller.js` — `getProctoringEvents` now
  enforces object-level authorization in the handler: platform admin sees all; college
  admin is scoped via `canReadCandidate`; a candidate sees only rows whose
  `candidate_id === req.user.id`.
- `backend/src/routes/submissions.routes.js` — drop the incorrect
  `candidateReadAccess('attemptId')` guard (which compared an attempt id to a candidate
  id) and keep `authenticateToken`.
- (Cross-cutting, delivered in AUTH_MIDDLEWARE) — interview session ownership, code-job
  ownership, and `req.user.id`-only session attribution.

## New files

None.

## Verification goals

After implementation, ALL of these must be true:

- [x] `GET /api/submissions/proctoring-events/:attemptId` requires authentication
- [x] A candidate receives only their own proctoring events (filtered by
      `candidate_id === req.user.id`)
- [x] A college admin receives only events for candidates in their college
- [x] A platform admin receives all events
- [x] Attempt endpoints still verify `test_attempts.candidate_id = req.user.id` via
      `loadOwnedAttempt`
- [x] Candidate CRUD routes still pair auth with `requireSelfOrAdmin` /
      `requireCandidateReadAccess` / `requireRole('admin')`
- [x] `node --check` passes on changed files

## Manual verification (for the human)

- Log in as candidate A, generate proctoring events for A's attempt, then request
  `/api/submissions/proctoring-events/<A attemptId>` as A → expect A's events only.
- Repeat with candidate B's token and A's attemptId → expect an empty list (403/empty).
- Log in as a college admin and confirm only that college's events are returned.
