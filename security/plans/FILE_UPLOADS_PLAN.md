# FILE_UPLOADS Fix Plan

## Changes

- None required — there are no server-side upload endpoints.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [x] No multipart/file-upload middleware in the backend
- [x] File imports are parsed client-side and sent as JSON
- [x] Import endpoints require admin authorization
- [ ] (Follow-up) Client-side parser libraries (`xlsx`, `pdfjs-dist`) upgraded — see
      DEPENDENCIES plan

## Manual verification (for the human)

- Confirm no route accepts `multipart/form-data`
  (`curl -F file=@x http://localhost:5000/api/questions` → 401/400, never a file handler).
- If a file-upload feature is added later, re-run this category against the new endpoint.
