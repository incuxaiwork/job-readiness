# RATE_LIMITING Fix Plan

## Changes

- `backend/src/index.js` — set `app.set('trust proxy', <hops>)` before the rate limiters:
  1 hop by default in production (Railway edge), overridable with the `TRUST_PROXY`
  environment variable (integer, or `false`); `'true'` is coerced to 1 so the unsafe
  boolean form is never used.
- `backend/.env.example` — document `TRUST_PROXY` with a placeholder.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [ ] `app.set('trust proxy', …)` present in `index.js`
- [ ] Production default is a bounded hop count (1), never boolean `true`
- [ ] `TRUST_PROXY=false` disables proxy trust (direct-connection deployments)
- [ ] Login/register/api/submission limiters still return 429 when exceeded
- [ ] Spoofing `X-Forwarded-For` does not let a client escape the per-IP limit

## Manual verification (for the human)

- Behind the real deployment, confirm a burst of >30 bad logins from one source returns
  429, and that traffic from a second source is not blocked.
- Confirm no `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` warnings appear in the server logs.
