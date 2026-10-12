# XSS Security Report

## Status: PASS (defense-in-depth note)

## Findings

### 1. No raw-HTML sinks in application code (PASS)
`grep -rniE "dangerouslySetInnerHTML|innerHTML|v-html|outerHTML|insertAdjacentHTML|document.write|srcdoc|eval\\(|new Function" frontend/src`
returns **no matches**. There is no `react-markdown`/`marked` rendering pipeline either
(the only `marked` hits are the local variable `markedForReview`). All dynamic content is
rendered through JSX expressions, which React escapes by default.

Representative user-controlled content that is rendered safely as text:
- Question text, options, explanations (assessment/coding screens).
- Candidate name/college/answers and admin-entered assessment metadata.
- API error strings surfaced by `Toast`/`Modal` (`frontend/src/services/api.js` throws
  `data.error`, displayed as text nodes).
- Resume/Excel-derived strings, which are parsed client-side and only ever inserted as
  text, not HTML.

### 2. Backend returns JSON only; no server-side templating (PASS)
The Express API responds with `res.json(...)` and serves a pre-built SPA; there is no
server-rendered HTML template, so classic reflected/stored template XSS does not apply.
The one HTML response is `frontend/dist/index.html`, a static build artifact with no
request-derived interpolation.

### 3. DOMPurify is present but unused by app code (INFO)
The production bundle contains a `purify.es-*.js` chunk pulled in transitively by
`monaco-editor` (a code-editor dependency). Application code never imports DOMPurify and
never needs to, because it never injects raw HTML. If a future feature must render
user-authored HTML, DOMPurify must be applied to that specific string.

### 4. Access token in `localStorage` is XSS-adjacent (LOW)
`frontend/src/services/api.js:17,42` mirrors the access JWT to `localStorage`
(`rsj_token`). There is no XSS sink today, so this is not currently exploitable, but any
future XSS would allow token theft. The refresh token is correctly HttpOnly. A strict CSP
(see SECURITY_HEADERS) bounds the injection surface (note: `script-src` still allows
`'unsafe-inline'` for the Vite bootstrap).

## What's at risk

Nothing today: no HTML-injection sink exists. The latent risks are (a) a future
`dangerouslySetInnerHTML` introduced without sanitization, and (b) token theft if an XSS
is ever introduced (mitigated by CSP, but not eliminated by `'unsafe-inline'`).

## What's already secure

- React JSX auto-escaping for all interpolated data.
- No `eval`/`new Function`/`document.write` and no `javascript:` URL sinks.
- API is JSON-only with no server-side template rendering.
- CSP + `frame-ancestors 'none'` + `X-Content-Type-Options: nosniff` reduce injection and
  framing risk.

## Recommendations (priority order)

1. No code change required for XSS. Keep the ban on `dangerouslySetInnerHTML`/`innerHTML`.
2. If raw HTML rendering is ever required, sanitize with DOMPurify (already available in
   the dependency tree) before insertion.
3. Defense-in-depth: move the access token to memory-only (keep the HttpOnly refresh
   cookie) to reduce blast radius if an XSS is introduced.
4. Follow-up: tighten `script-src` beyond `'unsafe-inline'` if the build allows a
   nonce/hash.

## Verification (implemented)

- `grep -rniE "dangerouslySetInnerHTML|innerHTML|v-html|document.write|eval\\(|new Function"`
  across `frontend/src` → no matches.
- Backend has no HTML-response path or request-derived templating.
