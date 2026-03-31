# testlframe (Frontend + Backend)

## Tech Stack
- Frontend: React + Vite + Monaco Editor
- Backend: Node.js (JavaScript) + Express + Socket.IO

## Local Run

### Backend
```bash
cd backend
npm install
PORT=5001 npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --port 5174
```

Open:
- Frontend: http://localhost:5174
- Backend health: http://localhost:5001/api/health

## Vercel Deployment

This repository is configured for Vercel with:
- static frontend output from `frontend/dist`
- serverless backend entry at `api/index.js`
- API route handling through `vercel.json`

### Deploy Steps
1. Import repository into Vercel.
2. Keep project root as repository root.
3. Vercel will use `vercel.json` automatically.
4. Add optional env vars if needed:
   - `FRONTEND_URL` (comma-separated allowed origins)
   - `TELEMETRY_DIR` (local/self-hosted only)

## Data Storage Notes

Current behavior:
- Quiz attempts are stored in memory (non-persistent).
- Telemetry frames are file-based (`backend/dataframes` locally, `/tmp/dataframes` on Vercel).

For production persistence, add a managed database.

Recommended choices:
- `Neon Postgres` (SQL, reliable for attempts/results)
- `Supabase Postgres` (SQL + dashboard)
- `MongoDB Atlas` (document-style telemetry/events)
- `Upstash Redis` (fast event counters and short-lived state)

Suggested database names:
- `testlframe_prod`
- `testlframe_staging`
- `testlframe_dev`
