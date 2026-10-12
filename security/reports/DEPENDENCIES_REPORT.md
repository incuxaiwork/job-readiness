# DEPENDENCIES Security Report

## Status: HIGH (backlog reduced; residual risks documented)

## Findings

`npm audit` initially reported **9** backend vulnerabilities and **16** frontend
vulnerabilities. `npm audit fix` (non-breaking) reduced these to **4** backend and **15**
frontend. All remaining advisories are triaged below by whether they are exploitable in
this deployment.

### 1. Backend — 4 remaining (all transitive through the Prisma CLI, build-time)
| Package | Severity | Path | Exposure |
|---|---|---|---|
| `prisma` | high | direct dependency (CLI/tooling) | Dev/build only — runs `prisma generate`/`migrate`, not in the request path |
| `@prisma/config` | high | `prisma` → `@prisma/config` | Build-time config loader |
| `deepmerge-ts` | high | `@prisma/config` → `deepmerge-ts` | Build-time |
| `mysql2` | high | `prisma` → `mysql2` | Prisma CLI's optional MySQL driver; the app uses `pg`, never MySQL |

The application's runtime data path is `express` → `pg` → PostgreSQL. None of the four
packages are reached while serving HTTP requests, and none process attacker-controlled
network input. A `npm audit fix --force` would downgrade `prisma` 7.10.0 → 6.x (breaking);
not applied. Tracked as an accepted, non-exploitable build-time risk pending an upstream
Prisma patch.

### 2. Frontend — runtime (shipped to browsers)
- **`pdfjs-dist@3.11.174` (high, GHSA-wgrm-67xf-hhpq)** — arbitrary JavaScript execution
  when opening a malicious PDF. **This one is reachable:** admins/candidates open
  PDFs through `frontend/src/utils/resumeParser.js`. Opening a hostile resume could run
  script in the opener's browser session. **Fix available:** upgrade to a patched major
  (`pdfjs-dist@4.x`) — requires reviewing the worker import in `resumeParser.js`.
- **`xlsx@0.18.5` (high, prototype pollution GHSA-4r6h-8v6p-xvw6 + ReDoS
  GHSA-5pgg-2g8v-p4x9)** — **reachable:** the admin Excel importer parses
  attacker-supplied spreadsheets in-browser (`frontend/src/utils/excelParser.js`). No fix
  is published on npm (SheetJS moved distribution to their own CDN). Mitigations: the
  importer is admin-only; the risk is prototype pollution/DoS in the *uploading admin's*
  browser, not server-side. **Recommended fix:** swap to the official SheetJS CDN build
  (`https://cdn.sheetjs.com/xlsx-0.20.x/...`) or a maintained parser.

### 3. Frontend — build/dev tooling (NOT shipped to production)
- `vite@5.4.21` (high, plus moderate/moderate) — dev-server path-traversal/`server.fs.deny`
  bypass advisories. The production Railway deploy serves the pre-built static
  `frontend/dist` via `server.mjs` and does **not** run the Vite dev server, so the
  affected code path is local-development only. Fix: bump Vite to a patched 5.x/6.x.
- `tailwindcss@3.4.19` (high, via `micromatch`/`braces`/`chokidar`/`fast-glob`) — `braces`
  stack-exhaustion DoS (GHSA-vfj7-8cjw-p6xm). PostCSS/Tailwind run only at build time on
  trusted input. Fix: bump the toolchain.
- `braces`/`micromatch`/`chokidar`/`fast-glob` (high) — transitive build-time deps of the
  above; not in the runtime bundle.

### 4. Frontend — critical `tar` is NOT installed (non-exploitable)
`tar` (critical, GHSA-23hp-3jrh-7fpw) is pulled in via the **optional** native dep
`canvas` → `@mapbox/node-pre-gyp` → `tar`. Neither `canvas` nor `tar` is present in
`frontend/node_modules` (verified: `tar NOT installed`, `canvas NOT installed`), so the
advisory has no reachable code and does not affect the build or the shipped bundle. It
appears only because it is recorded in `package-lock.json` as an optional edge.

## What's at risk

- **Realistic:** a malicious PDF opened by a user executes JS in their browser session
  (`pdfjs-dist`); a malicious XLSX parsed by an admin can pollute prototypes / DoS the
  admin's browser tab (`xlsx`).
- **Not realistic:** the four backend advisories (build-time Prisma CLI) and the Vite/
  Tailwind build-tool advisories (dev machines only) have no attacker-controlled path in
  production.

## What's already secure

- 12 vulnerabilities were removed via non-breaking `npm audit fix` (backend 9→4,
  frontend 16→15); the prior `proxy-addr` critical is gone.
- All direct dependencies are now **pinned to exact versions** (no `^`/`~`) in both
  `package.json` files; lockfiles are committed.
- The critical `tar` advisory is non-exploitable here (optional `canvas` not installed).
- No frontend dependency receives secrets; nothing sensitive is bundled.

## Recommendations (priority order)

1. **Upgrade `pdfjs-dist` to a patched major** and re-verify `resumeParser.js` (highest
   reachable runtime risk).
2. **Replace `xlsx`** with the SheetJS CDN build (≥0.20.3) or another maintained parser;
   keep the importer admin-only meanwhile.
3. **Bump the build toolchain** (`vite`, `tailwindcss`, and transitive
   `braces`/`micromatch`/`chokidar`/`fast-glob`).
4. **Backend:** track the Prisma CLI advisories; upgrade when a non-breaking patch lands
   (avoid `--force`, which downgrades Prisma to 6.x).
5. Keep pins exact and re-run `npm audit` on dependency bumps.

## Verification (implemented)

- `npm audit` (before → after): backend 9 → 4; frontend 16 → 15.
- `npm install --package-lock-only --ignore-scripts` re-synced both lockfiles to the
  pinned versions; `npm ls --depth=0` shows a valid tree.
- `frontend` lint (`oxlint`) passes (0 errors).
- Presence checks: `tar`/`canvas` absent from `node_modules`; `xlsx`/`pdfjs-dist` present.
