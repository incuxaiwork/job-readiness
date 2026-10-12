# FILE_UPLOADS Security Report

## Status: N/A (no server-side upload endpoints) — with a client-side parsing note

## Findings

### 1. The backend has no file-upload endpoints (PASS)
`grep -rniE "multer|formidable|busboy|multipart|upload" backend/src` returns nothing, and
`express.json({ limit: '1mb' })` / `express.urlencoded` are the only body parsers
(`index.js:89-90`). There is no route that accepts `multipart/form-data`, no file storage,
and no `uploads/` directory served. The checklist's magic-byte/rename/separate-domain
goals are therefore not applicable.

### 2. Files are parsed entirely in the browser (INFO / dependency risk)
Two features accept files, and in both the bytes never leave the client:
- **Excel/CSV question import** — `frontend/src/utils/excelParser.js:11`
  (`file.arrayBuffer()` -> `XLSX.read`). The parsed JSON is POSTed to the normal
  `POST /api/questions` JSON endpoint (`AdminQuestionBankPage.jsx:291-302`,
  `AdminAssessmentsPage.jsx:169`). The `accept=".xlsx,.xls,.csv"` attribute is UX-only;
  the server receives already-structured JSON and validates it as ordinary request data.
- **Resume upload for the AI mock interview / ATS** — `frontend/src/utils/resumeParser.js`
  (`file.arrayBuffer()` -> `pdfjs-dist` `getDocument`). Parsed text stays in the browser
  and is used to build the session; no file is transmitted.

Because parsing happens on the uploader's own machine, a malicious file can only attack
the *uploading admin's own browser*, not the server or other users. The relevant controls
are the client-side parser libraries:
- `xlsx@0.18.5` — carries known advisories (prototype pollution GHSA-4r6h-8v6p-xvw6,
  ReDoS GHSA-5pgg-2g8v-p4x9); no fixed 0.18.x is available upstream (SheetJS moved off
  npm). Tracked in the DEPENDENCIES report.
- `pdfjs-dist@3.11.174` — advisory GHSA for arbitrary JS execution when opening a
  malicious PDF; a patched major exists. Tracked in the DEPENDENCIES report.

### 3. No server-side size limit for file content (LOW, by design)
The 1 MB JSON body limit (`index.js:89`) caps the *parsed* payload size. The original
file size is limited only by the browser's `File` object; there is no `accept`-independent
server check because nothing is uploaded. Admin-only access to the import features
(`requireRole('admin')` on `/api/questions` mutations) bounds who can reach the parser.

## What's at risk

Nothing server-side. The only exposure is a malicious Excel/PDF opening code in the
uploading admin's browser, which is bounded to that single admin's session and depends on
an unpatched upstream parser.

## What's already secure

- No multipart endpoint, no file storage, no user files on the app origin.
- Imported question data is validated server-side as ordinary JSON.
- Import endpoints are admin-only (`requireRole('admin')`).
- Parsing is sandboxed to the client; the server never opens an untrusted file.

## Recommendations (priority order)

1. No server-side change required.
2. If a future feature uploads files to the backend, implement: magic-byte type
   validation (not extension), server-side size limits, UUID renames, storage on a
   separate domain/bucket, and never serve uploads from the app origin.
3. Upgrade `xlsx` to a maintained distribution (SheetJS CDN build) and `pdfjs-dist` to a
   patched release; see DEPENDENCIES plan.

## Verification (implemented)

- `grep -rniE "multer|formidable|busboy|multipart|upload" backend/src` -> no matches.
- `package.json` (both) contains no upload middleware.
- File-parsing call sites confirmed to use `file.arrayBuffer()` client-side and POST JSON.
