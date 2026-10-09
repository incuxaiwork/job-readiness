# JobRecipe - Job Readiness + AI Mock Interview

One project, one frontend, one backend, one database.

```
jobrecipe/
  frontend/     React + Vite (the only UI)            -> http://localhost:5173
  backend/      Node/Express + Prisma (the only API)  -> http://localhost:5000
  (PostgreSQL)  one database, schema = backend/prisma/schema.prisma
```

The browser talks only to `backend`. AI features run in the frontend with
MediaPipe (face / attention proctoring) and in the Node backend (resume parsing,
interview question flow and scoring). There is no separate AI service to deploy.

## First-time setup
1. Create one Postgres database, e.g. `jobrecipe`.
2. Copy env templates and fill them in:
   - `backend/.env.example`     -> `backend/.env`   (DATABASE_URL, JWT_SECRET)
   - `frontend/.env.example`    -> `frontend/.env`
3. Install and create tables:
   ```bash
   npm run install:all
   npm run db:generate
   npm run db:migrate
   npm run seed                # optional demo data
   ```

## Run everything with one command
```bash
npm run dev          # backend + frontend
npm run dev:backend  # backend only
npm run dev:frontend # frontend only
```

## Production (single deployable)
```bash
npm run build        # builds frontend/dist
npm run start        # backend serves the API and frontend/dist together
```

## Deploy to Railway (two services)
Each service points at a sub-folder as its **Root Directory**; each folder has its
own `railway.json`.

### Service BE — API (`Root Directory: backend`)
- Build: `npx prisma generate` — Nixpacks' install phase already runs `npm ci`;
  the build command only generates the Prisma client.
- Start: `node src/index.js` — binds `0.0.0.0:$PORT`, serves `/api/*`.
- Health check: `/api/health`.
- Variables: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `NODE_ENV=production`,
  `CORS_ORIGIN=https://<frontend-service-url>`, and
  `REFRESH_COOKIE_SAMESITE=none`. Railway injects `PORT`.

### Service FE — frontend (`Root Directory: frontend`)
- Build: `npm run build` — Nixpacks' install phase already ran `npm ci`.
- Start: `node server.mjs` — serves `frontend/dist` with SPA fallback
  (`server.mjs`), so React Router deep links work.
- Variables: `VITE_API_URL=https://<backend-service-url>/api` (read at build time).

The build tools (`vite`, `tailwindcss`, `@vitejs/plugin-react`, `prisma` CLI) are
declared in each package's `dependencies` so Nixpacks' single `npm ci` installs
them even with `NODE_ENV=production`. **Never put another `npm ci`/`npm install`
in the build command** — Nixpacks installs once, and a second `npm ci` fails with
`EBUSY` removing `node_modules/.cache`. Build commands can alternatively be
pasted into the service's "Build command" field in the Railway dashboard.

### Split-deploy gotchas (handled)
- The refresh-token cookie is set by the backend with
  `SameSite=<REFRESH_COOKIE_SAMESITE>` (`auth.controller.js`) — on two different
  domains it must be `none` (with HTTPS) or the browser won't send it, breaking
  session refresh.
- CORS must list the frontend URL (`credentials: true` is already enabled).
- `VITE_API_URL` must point at the backend at build time; `frontend/src/services/api.js`
  already sends `credentials: "include"` and uses this URL.

### Database safety (Prisma)
The schema is created and upgraded **idempotently at startup** by
`backend/src/db/schema.js` (`initSchema`) using `CREATE TABLE IF NOT EXISTS` /
`ADD COLUMN IF NOT EXISTS`. Prisma is only used to generate the query client —
its migration folder is a one-time baseline, not the source of truth.

**Never run `prisma migrate reset`, `prisma migrate dev`, or
`prisma db push --force-reset` against production** — those drop data. To keep
Prisma's migration ledger safe, use:
```bash
npm run db:baseline   # marks the existing baseline migration as applied (no data touched)
npm run db:migrate    # baseline + prisma migrate deploy (applies only NEW migrations)
```
The deployed database is a persistent Railway Postgres volume; it is only wiped
if a destructive reset command is run against it.

