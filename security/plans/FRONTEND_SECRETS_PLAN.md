# FRONTEND_SECRETS Fix Plan

## Changes

- `backend/src/routes/tts.routes.js` (new) — authenticated `POST /speak` proxy that
  calls ElevenLabs with the server-side `ELEVENLABS_API_KEY` and streams `audio/mpeg`
  back; returns 503 when unconfigured (frontend falls back to Web Speech).
- `backend/src/index.js` — mount `ttsRoutes` at `/api/tts` and `/tts`.
- `backend/.env.example` — document `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`
  (server-side only).
- `frontend/src/pages/candidate/AIMockInterviewPage.jsx` — remove the `VITE_`
  ElevenLabs key/voice reads; call `/api/tts/speak` with the bearer token; fall back to
  browser TTS when the proxy is unavailable.
- `frontend/.env.example` — replace the `VITE_ELEVENLABS_*` variables with a note that
  the key is backend-only.

## New files

- `backend/src/routes/tts.routes.js`

## Verification goals

After implementation, ALL of these must be true:

- [x] No `VITE_ELEVENLABS_API_KEY` (or any secret) exists in `frontend/src` or frontend
      env
- [x] `grep` for `elevenlabs.io` / `xi-api-key` in `frontend/src` returns nothing
- [x] The ElevenLabs key is read only from `process.env` in the backend
- [x] `POST /api/tts/speak` requires authentication (`authenticateToken`)
- [x] The TTS route validates `text` (type + length) and the voice id before building
      the upstream URL
- [x] The route returns 503 when `ELEVENLABS_API_KEY` is unset (frontend falls back)
- [x] `frontend/.env.example` and `backend/.env.example` document the correct placement
- [x] `node --check` passes on backend changes; frontend lints with 0 errors

## Manual verification (for the human)

- Without `ELEVENLABS_API_KEY`: start an interview and confirm the browser voice is used
  (no errors, no key needed).
- With `ELEVENLABS_API_KEY` set on the backend: confirm the lifelike voice plays and the
  network tab shows a call to `/api/tts/speak` (no third-party call from the browser).
