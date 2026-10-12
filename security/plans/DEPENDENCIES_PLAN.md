# DEPENDENCIES Fix Plan

## Changes

- Pinned all direct dependencies to exact versions (removed `^`/`~`) in
  `backend/package.json` and `frontend/package.json`.
- Ran `npm audit fix` (non-breaking) in both packages; lockfiles re-synced.

## New files

- None.

## Verification goals

After implementation, ALL of these must be true:

- [x] No `^` or `~` in `backend/package.json` / `frontend/package.json` dependencies
- [x] `npm audit` counts reduced (backend 9→4, frontend 16→15)
- [x] Remaining backend advisories are build-time-only (Prisma CLI), on no runtime path
- [x] Critical `tar` advisory confirmed non-exploitable (optional `canvas` not installed)
- [x] `npm ls --depth=0` yields a valid tree; frontend lint passes
- [ ] (Follow-up) `pdfjs-dist` upgraded to a patched major
- [ ] (Follow-up) `xlsx` replaced with the SheetJS CDN build (≥0.20.3)
- [ ] (Follow-up) `vite` / `tailwindcss` toolchain bumped
- [ ] (Follow-up) Prisma CLI advisories cleared when an upstream patch lands

## Manual verification (for the human)

- Re-run `npm audit --prefix backend` and `npm audit --prefix frontend`; confirm the
  remaining items are the transitive/build-time ones listed in the report.
- After upgrading `pdfjs-dist`, open a PDF resume end-to-end in the app to confirm the
  worker still loads and text extraction works.
- After replacing `xlsx`, import the sample Excel template and a real question file to
  confirm parsing is unchanged.
