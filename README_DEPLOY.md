# Health Trend — Deployment checklist (Dokploy)

## 0) Preconditions
- Postgres available (managed DB or container)
- Domain: `health.holstjensen.nu`
- You have generated strong secrets
- **Python 3 runtime is included in Docker image** (used for Garmin login helper)

## 1) Required environment variables
Set these in Dokploy (do **not** commit real values):

- `DATABASE_URL`
- `BETTER_AUTH_BASE_URL` (e.g. `https://health.holstjensen.nu`)
- `BETTER_AUTH_SECRET` (32+ random chars)
- `NEXT_PUBLIC_APP_URL` (e.g. `https://health.holstjensen.nu`)
- `ENCRYPTION_KEY` (used for Garmin token encryption; 32+ chars or base64 32 bytes)
- `OPENAI_API_KEY` (optional, required for AI brief)
- `CRON_SECRET` (strong random string)

## 2) Database
- Run migrations on deploy:
  - `npx prisma migrate deploy`

## 3) Cron / scheduled jobs
### Endpoint
- `POST /api/cron/run`

### Auth
Prefer header:
- `x-cron-secret: <CRON_SECRET>`

Fallback allowed:
- `?secret=<CRON_SECRET>`

### Suggested schedules
- Morning (07:20): `mode=snapshot_and_brief`
- Evening (21:20): `mode=snapshot_and_brief`

Example payload:
```json
{ "mode": "snapshot_and_brief" }
```

## 4) After deploy: sanity checks
- Can you login?
- `/settings`: enable + verify TOTP
- `/garmin`: login (recommended) or import tokens (fallback)
- `/snapshots`: take snapshot
- `/`: generate brief
- `/alerts`: see alerts (if MED/HIGH happens)
