# health-trend

Health Trend is a small self-hosted health dashboard:
- Garmin snapshots multiple times per day (morning/midday/evening)
- Manual inputs (symptoms, caffeine cups, alcohol units, notes, trained/meds)
- AI illness/overload trend brief + deterministic flags
- PWA + responsive + Danish UI

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Postgres + Prisma
- Better Auth (password login + TOTP 2FA)
- Docker/Dokploy deployment

## Local dev
1) Create a Postgres DB and set `DATABASE_URL` (see `.env.example`).
2) Install Node deps: `npm install`
3) Install Python deps (required for Garmin login + token-based snapshots):
   ```bash
   python -m pip install -r garmin/requirements.txt
   ```
4) Run migrations: `npx prisma migrate dev`
5) Run dev server: `npm run dev`

## Env
Copy `.env.example` to `.env` and fill:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `ENCRYPTION_KEY`
- `OPENAI_API_KEY`
- `CRON_SECRET` (required in prod)

## Deployment
See `README_DEPLOY.md` (Dokploy checklist + cron setup).

## Notes
- Garmin tokens will be stored encrypted at rest using `ENCRYPTION_KEY`.
- We avoid storing Garmin passwords long-term.
- Login flow supports **2FA (TOTP)**.
