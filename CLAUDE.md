# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Health Trend is a self-hosted health dashboard (Danish UI, PWA) that integrates Garmin fitness data with manual health inputs and AI-powered insights. It runs on Next.js 16 (App Router) with TypeScript, Tailwind CSS v4, Postgres/Prisma, Better Auth, and OpenAI.

## Commands

```bash
npm run dev                # Start dev server (Turbopack)
npm run build              # Production build (also type-checks)
npm run lint               # ESLint
npm start                  # Start production server
npx prisma migrate dev     # Run/create migrations
npx prisma migrate dev --name <name>  # Create new migration
npm run bootstrap-users    # Seed demo users
npm run import-garmin      # Import local Garmin JSON files
```

No test framework is configured. Type checking happens via `npm run build`.

## Architecture

### App Structure (Next.js App Router)

- `auth.ts` (root) — Better Auth config (email/password + TOTP 2FA, Prisma adapter, nextCookies plugin)
- `app/(protected)/` — All authenticated pages (dashboard, snapshots, settings, garmin, alerts, reports, insights, activities)
- `app/api/` — 24 API routes covering auth, AI briefs, cron, garmin, manual inputs, plans, snapshots, trends, etc.
- `src/lib/` — Shared server/client utilities
- `src/components/` — React components (AppShell layout, shadcn/ui in `ui/`)

### Path Alias

`@/*` maps to `./src/*` (tsconfig paths).

### Auth Pattern

Better Auth with Prisma adapter. All protected API routes and pages use:
```typescript
import { requireUser } from "@/lib/serverAuth";
const user = await requireUser();
if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
```

### Database (Prisma + PostgreSQL)

Key models: `User`, `UserProfile` (goals, cycle tracking), `GarminAccount` (encrypted tokens), `GarminSnapshot` (daily health metrics), `ManualDaily` (user inputs), `AiBrief` (daily AI risk assessment), `AiDayPlan`, `AiWeeklyReport`, `Alert`.

Most models use unique constraints on `(userId, day)` for idempotent upserts.

Local dev Postgres via `docker-compose.dev.yml` (postgres:16, port 5432, user/pass: postgres/postgres).

### Garmin Integration

Two paths for getting health data:
1. **Remote (primary):** User authenticates via `/api/garmin/login` → spawns Python `garmin/garmin_login.py` → tokens encrypted with AES-256-GCM and stored in `GarminAccount`. Snapshots fetched by spawning `garmin/export_daily.py`.
2. **Local fallback:** Read Garmin JSON files from disk via `src/lib/garminLocal.ts`.

Python deps in `garmin/requirements.txt`. Install with `python -m pip install -r garmin/requirements.txt`.

### AI Features

- **AI Brief** (`/api/ai/brief`): Gathers snapshots + manual inputs + profile + 14-day baseline → OpenAI gpt-4o-mini → returns `{ risk, short, signals, suggestions }`. Stored in `AiBrief`.
- **Day Plans** (`/api/plan/today`, `/api/plan/tomorrow`): Deterministic (no AI call) — computes intensity based on sleep debt, stress, body battery, previous risk.
- **Weekly Reports** (`/api/reports/weekly`): AI-generated 7-day summary.
- AI prompts are in Danish.

### Deterministic Insights

`src/lib/insights.ts` — Computes 14-day baseline, sleep debt, streaks, and early warning detection (RHR/stress/body battery deltas vs baseline). Creates `Alert` records when thresholds exceeded.

### Cron System

`POST /api/cron/run` — Authenticated via `x-cron-secret` header. Takes `{ day, mode: "snapshot_only" | "snapshot_and_brief" }`. Iterates all users: fetch Garmin → create snapshot → detect warnings → optionally generate AI brief.

### Date Handling

All dates use `Europe/Copenhagen` timezone. `src/lib/date.ts` provides `ymd()` and `addDaysYmd()` helpers. Day strings are `YYYY-MM-DD` format throughout.

### Rate Limiting

In-memory rolling window per IP/key. Defined in `src/lib/rateLimit.ts`.

### Encryption

Garmin tokens encrypted at rest with AES-256-GCM (`src/lib/crypto.ts`). Format: `v1:<base64(iv)>.<base64(tag)>.<base64(ciphertext)>`. Key from `ENCRYPTION_KEY` env var.

## Environment Variables

Copy `.env.example` to `.env`. Required:
- `DATABASE_URL` — Postgres connection string
- `BETTER_AUTH_SECRET` — 32+ chars for session signing
- `BETTER_AUTH_BASE_URL` — App URL (e.g. `http://localhost:3000`)
- `NEXT_PUBLIC_APP_URL` — Public app URL
- `ENCRYPTION_KEY` — 32+ chars for Garmin token encryption
- `OPENAI_API_KEY` — For AI features
- `CRON_SECRET` — Required in prod for `/api/cron/run`

## API Route Pattern

All API routes follow this pattern:
1. `requireUser()` for auth
2. `rateLimit(req, { name, limit, windowMs, keyParts })` for throttling
3. Business logic with Prisma
4. Return `NextResponse.json()` with rate limit headers
