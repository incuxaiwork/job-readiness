# SSRF Security Report

## Status: PASS

## Findings

The app performs only three outbound HTTP requests from the backend, and **none of them
use a URL supplied by the user**:

| Call site | Target | Source of URL |
|---|---|---|
| `codeExecutionService.js:130` | Judge0 `/submissions` | `process.env.JUDGE0_URL` (env constant) |
| `codeExecutionService.js:226` | Piston `/api/v2/execute` | `process.env.PISTON_URL` (env constant) |
| `tts.routes.js:40` | ElevenLabs `/text-to-speech/:voiceId/stream` | constant base + allowlisted voice id |

- There is no link-preview, image-proxy, URL-validator, or import-from-URL feature.
- `grep` for `req.body.url`, `req.query.url`, `new URL(...)` with request data, or
  user-controlled `startsWith('http')` in `backend/src` returns nothing.
- The Judge0/Piston request bodies are built from validated, allowlisted inputs: the
  language is checked with `isLanguageSupported()` against a fixed `LANGUAGE_CONFIG`
  map (`codeExecutionService.js:91-94`) before use, so `language` cannot inject into the
  URL path. User code is sent only in the request **body** (expected for a code runner).
- The new TTS proxy (`tts.routes.js`) validates the voice id with a strict
  `/^[A-Za-z0-9]{10,40}$/` allowlist before interpolating it into the upstream URL,
  which prevents path/URL injection through that parameter.

## What's at risk

Nothing from classic SSRF (no user-controlled request target). The residual consideration
is that the code-execution backend is intentionally reachable and executes untrusted
code — that is the product feature, not SSRF; it is bounded by the remote sandbox and
now requires authentication (see AUTH_MIDDLEWARE).

## What's already secure

- All outbound hosts are environment-configured constants.
- User input never forms the scheme/host of an outbound request.
- Language and voice parameters are validated against allowlists.
- Private-IP ranges are not reachable because the URL host is never attacker-controlled.

## Recommendations (priority order)

1. No code change required for SSRF.
2. Keep the rule: any future feature that fetches a user-provided URL must parse it with
   `new URL()`, allow only `http`/`https`, resolve the hostname, and block
   `127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1`.
3. Keep `JUDGE0_URL`/`PISTON_URL` pinned to trusted hosts and never accept an
   executor URL from the client.
