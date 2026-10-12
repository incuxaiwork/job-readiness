# SSRF Fix Plan

## Changes

None required — no user-supplied URL fetching exists.

Defense-in-depth already in place:
- Judge0/Piston URLs are environment constants (`JUDGE0_URL`, `PISTON_URL`).
- `language` is allowlisted via `LANGUAGE_CONFIG`/`isLanguageSupported` before use.
- The TTS proxy allowlists the `voiceId` before building the upstream URL.

## New files

None.

## Verification goals

After review, ALL of these must be true:

- [x] No outbound request target is derived from user input
- [x] `grep` for user-controlled URLs (`req.body.url`, `req.query.url`, `new URL(` with
      request data) in `backend/src` returns nothing
- [x] Language and voice parameters are allowlisted before URL construction
- [x] No code path can be pointed at a private/internal IP range by a client

## Manual verification (for the human)

- None required.
