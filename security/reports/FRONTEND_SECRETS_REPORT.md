# FRONTEND_SECRETS Security Report

## Status: MEDIUM (remediated)

## Findings

### 1. ElevenLabs secret API key used directly from the browser (MEDIUM) — FIXED
`frontend/src/pages/candidate/AIMockInterviewPage.jsx` read a secret key from a
`VITE_` variable and sent it to a third-party API from the browser:
```js
const ELEVEN_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const ELEVEN_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
…
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}/stream`, {
  headers: { 'xi-api-key': ELEVEN_API_KEY, … }
});
```
Every `VITE_` value is inlined into the public JavaScript bundle by Vite, so any
ElevenLabs key placed here is downloadable by every visitor and usable against the
account's quota. The key is currently **blank** in `frontend/.env`, so no live secret
was exposed — but the code path actively invites putting a secret in the client.

Fixed: TTS now goes through a new authenticated backend proxy
(`POST /api/tts/speak`) that holds `ELEVENLABS_API_KEY` server-side and streams the
audio back. The frontend no longer references any ElevenLabs key, and
`frontend/.env.example` now documents that the key belongs on the backend only.

### 2. Access token persisted in `localStorage` (INFO / XSS-adjacent)
`frontend/src/services/api.js:17,42,297` stores the access JWT in `localStorage`
(`rsj_token`). Any XSS can read and exfiltrate it. The refresh token is correctly kept
in an HttpOnly cookie. This is a defense-in-depth concern tracked under XSS; the
in-memory-only token would be stronger.

### 3. Third-party CDN assets contain no secrets (PASS)
`proctoringService.js` loads MediaPipe wasm/model from `cdn.jsdelivr.net` and
`storage.googleapis.com`; `resumeParser.js` loads the pdf.js worker from `cdnjs`
(public assets, no credentials). No key or token accompanies those requests.

### 4. No secret keys in frontend source (PASS)
`grep` for `sk_live_`, `sk_test_`, `AKIA`, `api_key`, `Bearer`, `secret` across
`frontend/src` returns only the bearer **access token** the app legitimately attaches to
its own backend requests (expected) and UI text. No third-party secret is hardcoded.

### 5. Public env vars hold no secrets (PASS)
`frontend/.env` defines only `VITE_API_URL=/api` and a public voice id; the ElevenLabs
key is blank. After this fix, no `VITE_` variable carries a secret.

## What's at risk

- (Before fix) A configured `VITE_ELEVENLABS_API_KEY` would leak to all users, allowing
  quota theft and abuse of the ElevenLabs account.
- (Residual) LocalStorage access tokens are readable by any successful XSS.

## What's already secure

- Refresh token is an HttpOnly cookie, not reachable from JS.
- No secret is hardcoded in frontend files.
- Third-party assets are public CDN resources with no credentials.

## Recommendations (priority order)

1. Proxy TTS through the backend; keep the key server-side; never use a `VITE_`/
   `NEXT_PUBLIC_`/`REACT_APP_` prefix for a secret. *(done)*
2. Consider moving the access token out of `localStorage` (memory-only + silent refresh)
   to reduce XSS blast radius.
3. Configure a CSP that allowlists the CDNs actually used (see SECURITY_HEADERS).
