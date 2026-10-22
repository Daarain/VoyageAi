# VoyageAI Pro — Complete Setup Guide

## Step 1: Install dependencies

```bash
npm install
cd backend && pip install -r requirements.txt
```

## Step 2: Supabase (database + auth)

1. Go to https://supabase.com → New project (free)
2. Dashboard → SQL Editor → paste `supabase/schema.sql` → Run
3. Dashboard → Settings → API → copy:
   - Project URL
   - anon/public key
   - service_role key (backend only)

## Step 3: Environment variables

```bash
cp .env.local.example .env.local
# Fill in all values in .env.local
```

Required values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_VOYAGE_API_URL=http://localhost:8000
SUPABASE_URL=https://xxxx.supabase.co             ← backend/.env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   ← backend/.env
CORS_ORIGINS=http://localhost:3000
AISHUB_USERNAME=your-aishub-username              ← from aishub.net/join (free)
NEXT_PUBLIC_AISHUB_CONFIGURED=true
EIA_API_KEY=your-eia-key                          ← from eia.gov/opendata (free, optional)
```

## Step 4: Real market data (optional but recommended)

```bash
cd backend
python fetch_market_data.py    # downloads Baltic indices + bunker + port data
python train.py                # trains ML models on real data (~1 min)
```

See `backend/DATA_SOURCES.md` for manual download instructions if the script fails.

## Step 5: Run

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd backend
uvicorn app.api:app --port 8000 --reload
```

Open http://localhost:3000

## Deploy (all free)

| Service  | What            | URL                    |
|----------|-----------------|------------------------|
| Vercel   | Next.js frontend| vercel.com             |
| Render   | FastAPI backend | render.com             |
| Supabase | Database + Auth | supabase.com           |

### Vercel
```
npx vercel
# Add all NEXT_PUBLIC_* env vars in Vercel dashboard
```

### Render
- New Web Service → connect repo → set Root Directory: `backend`
- Build command: `pip install -r requirements.txt && python train.py`
- Start command: `uvicorn app.api:app --host 0.0.0.0 --port $PORT`
- Add env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`

After deploying to Render, update `NEXT_PUBLIC_VOYAGE_API_URL` in Vercel to your Render URL.
