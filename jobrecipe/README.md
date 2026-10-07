# JobRecipe - Job Readiness + AI Mock Interview

One project, one frontend, one backend, one database.

```
jobrecipe/
  frontend/     React + Vite (the only UI)            -> http://localhost:5173
  backend/      Node/Express + Prisma (the only API)  -> http://localhost:5000
  ai-service/   Python FastAPI, INTERNAL helper only  -> http://127.0.0.1:8000
  (PostgreSQL)  one database, schema = backend/prisma/schema.prisma
```

The browser talks only to `backend`. The backend calls `ai-service`
(face/phone detection, AI helpers) using `AI_SERVICE_URL`. `ai-service` has no database.

## First-time setup
1. Create one Postgres database, e.g. `jobrecipe`.
2. Copy env templates and fill them in:
   - `backend/.env.example`     -> `backend/.env`   (DATABASE_URL, JWT_SECRET, AI_SERVICE_URL)
   - `frontend/.env.example`    -> `frontend/.env`
   - `ai-service/.env.example`  -> `ai-service/.env` (GEMINI_API_KEY, GROQ_API_KEY)
3. Install and create tables:
   ```bash
   npm run install:all
   npm run install:ai          # Python deps (use a venv)
   npm run db:generate
   npm run db:migrate
   npm run seed                # optional demo data
   ```

## Run everything with one command
```bash
npm run dev          # backend + frontend + ai-service
npm run dev:core     # backend + frontend only (face detection falls back to defaults)
```

## Production (single deployable)
```bash
npm run build        # builds frontend/dist
npm run start        # backend serves the API and frontend/dist together
```
Run `ai-service` next to it and set `AI_SERVICE_URL`.
