# XSS Fix Plan

## Changes

- None required — no HTML-injection sink exists.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [x] No `dangerouslySetInnerHTML`/`innerHTML`/`v-html`/`document.write`/`eval`/`new Function`
      in `frontend/src`
- [x] All user content rendered through JSX (escaped) or as text nodes
- [x] Backend returns JSON only (no server-rendered HTML with request data)
- [x] CSP, `frame-ancestors 'none'`, and `nosniff` set (see SECURITY_HEADERS report)

## Manual verification (for the human)

- Submit a candidate/assessment field containing `<img src=x onerror=alert(1)>` and
  confirm it is displayed literally (not executed) in the admin/candidate UI.
- Confirm the browser console shows no CSP violations on normal navigation.
