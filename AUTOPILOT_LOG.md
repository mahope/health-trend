# Autopilot Log

Autopilot writes short entries here.

## 2026-02-09 22:00 (Europe/Copenhagen)
- Changed: UserMenu now closes on outside click + Esc. Marked the 3 "Now" backlog items as done. Added `scripts/kill-port-3000.ps1` helper.
- Commit: 583954c
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 22:10 (Europe/Copenhagen)
- Changed: Added lightweight toast system + optional haptics. Wired into Dashboard actions (snapshot/brief) + autosave in Manual form (rate-limited success toast, always toast on error).
- Commit: 774800b
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 22:20 (Europe/Copenhagen)
- Changed: Included profile context (sex/pregnant/cycleDay) in the AI daily brief prompt payload + instruction so the model can adjust interpretation/suggestions.
- Commit: 2c5a764
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 22:30 (Europe/Copenhagen)
- Changed: Added a simple `cyclePhase` (rough heuristic) to the AI brief prompt payload + tweaked prompt instruction to consider cycle phase for interpretation.
- Commit: ad42127
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 22:43 (Europe/Copenhagen)
- Changed: Included profile context (sex/pregnant/cycleDay + derived cyclePhase) in the AI day plan prompt payload + instruction tweak to mention cycle variation only when relevant. Marked backlog item as done.
- Commit: 621c1a4
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 22:52 (Europe/Copenhagen)
- Changed: Included profile context (sex/pregnant/cycleDay + derived cyclePhase) in the AI weekly report prompt payload + instruction tweak to mention cycle variation only when relevant. Marked backlog item as done.
- Commit: ad6d91b
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 23:00 (Europe/Copenhagen)
- Changed: Added basic cycle tracking to Settings (last period start, cycle length estimate, symptoms). Extended profile context API + Prisma schema/migration.
- Commit: e6d8866
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 23:13 (Europe/Copenhagen)
- Changed: Added 30s undo for snapshot delete on /snapshots (optimistic remove, delayed delete) using a toast action button. Extended toast provider to support actions + custom duration + sticky toasts.
- Commit: e8f68c3
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 23:23 (Europe/Copenhagen)
- Changed: When a snapshot is deleted, the cached AI brief for that day is now best-effort recomputed (if AI is configured). If recompute fails, the brief cache is cleared to avoid showing stale data. Marked backlog item as done.
- Commit: 21f709d
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-09 23:30 (Europe/Copenhagen)
- Changed: Wired existing toast+haptics system into Settings save flows (goals + context) + 2FA enable/verify for quick mobile feedback.
- Commit: ec107b5
- Tests: npm run lint ✅, npm run build ✅

## 2026-02-09 23:42 (Europe/Copenhagen)
- Changed: Added mobile pull-to-refresh (coarse pointer/touch only) in `AppShell` using a lightweight `PullToRefresh` wrapper (shows a small top indicator + triggers `router.refresh()`). Marked backlog item as done.
- Commit: 408cad3
- Tests: npm run lint ✅, npm run build ✅

## 2026-02-09 23:50 (Europe/Copenhagen)
- Changed: Added toasts + haptics feedback for snapshot/brief actions on `/snapshots`, `AiBriefCard`, and the mobile action bar (replaces `alert()` with toasts). Marked backlog item as done.
- Commit: 7b092a5
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:01 (Europe/Copenhagen)
- Changed: Manual form now shows inline autosave status: "Gemmer…" while saving and "Gemt ✓" briefly after successful autosave (in addition to rate-limited toast). Marked backlog item as done.
- Commit: 98af5d3
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:10 (Europe/Copenhagen)
- Changed: Added quick chips in Manual form for +1 koffein/+1 alkohol/+1 symptom (capped at 3) + a small "nulstil" action. Marked backlog item as done.
- Commit: 02f73fc
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:22 (Europe/Copenhagen)
- Changed: Improved first-run empty state for snapshots: added a clear "Tag første snapshot" CTA (mobile-friendly) + nicer error box that shows hint/file path when Garmin JSON is missing.
- Commit: 5f6141f
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:33 (Europe/Copenhagen)
- Changed: Added empty state + CTA in Trends charts when there's no data yet (links to "Snapshots" section). Added `id="snapshots"` anchor on dashboard.
- Commit: e01f307
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:40 (Europe/Copenhagen)
- Changed: Improved first-run empty states: AI brief card now guides snapshot/manual first with CTAs; Activities card now has a clearer "Tag snapshot" CTA. Also deferred heavy Recharts trends charts into a lazy-loaded client boundary (`DashboardBelowFold`) for faster initial render. Marked backlog perf item as done.
- Commit: c4b50ac
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:53 (Europe/Copenhagen)
- Changed: Added a top-level dashboard empty-state CTA when user has no snapshots yet (links to #snapshots / #manual).
- Commit: 85109f8
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 01:05 (Europe/Copenhagen)
- Changed: Added sleep debt trend (14-day sparkline) in Insights with a 7d/14d debt-window toggle. Added new API endpoint /api/insights/sleep-debt-trend.
- Commit: 8cb716a
- Tests:
pm run lint ?,
pm run build ?


## 2026-02-10 01:15 (Europe/Copenhagen)
- Changed: Improved first-snapshot empty states/CTAs on /snapshots (incl. nicer missing-garmin-file errors), and added a new Insights card that compares LOW-risk days vs. overall averages (last ~30 days).
- Commit: b891633
- Quick test: npm run lint ?, npm run build ?

## 2026-02-10 01:21 (Europe/Copenhagen)
- Changed: Added a 1-line "Coach" hint in the global header on Dashboard by showing the latest AI brief short text (if present).
- Commit: 8b9b3e3
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 01:30 (Europe/Copenhagen)
- Changed: Added "Plan i morgen" alongside "Plan i dag" (toggle) in DayPlanCard. Implemented `/api/plan/tomorrow` endpoint + a simple deterministic tomorrow heuristic (based on today) + optional AI prompt.
- Commit: dd246fd
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 01:42 (Europe/Copenhagen)
- Changed: Added Copy/Share/Save actions to Ugereview. Formats the AI weekly review as shareable text, supports Web Share API, clipboard fallback, and download as `.md`.
- Commit: 62088ef
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 01:53 (Europe/Copenhagen)
- Changed: Extended AI daily brief prompt to optionally suggest what to track manually next (0-3 fields). When present, we prepend a "Track i manual (i morgen)" suggestion for quick guidance. Marked backlog items (weekly save/share + track-next) as done.
- Commit: 5c2d264
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 02:00 (Europe/Copenhagen)
- Changed: Added a lightweight overstimulation heuristic (stress/BB trend + manual caffeine/symptom) into the AI daily brief payload and prompt instruction so the model can flag likely overstimulation patterns + suggest simple regulation actions. Marked backlog item as done.
- Commit: 73daad5
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 02:10 (Europe/Copenhagen)
- Changed: Added in-memory rate limiting for `/api/manual/upsert` (per-user+IP) and `/api/auth/*` (per-IP) with 429 + `Retry-After` and basic `X-RateLimit-*` headers. Marked backlog item as done.
- Commit: aa4ab0b
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 02:22 (Europe/Copenhagen)
- Changed: Added `/api/health` endpoint (JSON + db ping) + a minimal `/uptime` page for quick mobile status checks. Also fixed a lingering eslint `no-explicit-any` issue in `rateLimit` helper.
- Commit: 39a7f8c
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 02:30 (Europe/Copenhagen)
- Changed: Improved "no data yet" UX for AI brief: server now returns a clear error when you try to generate a brief without any snapshots; UI shows a friendly message ("Tag mindst ét snapshot først.").
- Commit: e2e19f4
- Tests: `npm run lint` ✅, `npm run build` ✅


## 2026-02-10 02:44 (Europe/Copenhagen)
- Changed: Standardized first-run empty states for snapshots on Dashboard + LatestSnapshotCard using the shared EmptyState component, with clearer next steps + links to Garmin/Snapshots.
- Commit: 251c08d
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 02:56 (Europe/Copenhagen)
- Changed: Made snapshot writes idempotent (DB upsert + file store replace). Cron endpoint now uses a stable takenAt per day (retry-safe) and emits structured start/finish logs (runId/idempotencyKey/duration). Marked backlog item as done.
- Commit: 5fe3e92
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 03:00 (Europe/Copenhagen)
- Changed: Improved first-time empty state on Dashboard (clear CTAs to Snapshots/Garmin). Added Recovery score widget card (BB low + sleep + stress) based on latest snapshot. Marked backlog item #8 as done.
- Commit: 71270f2
- Tests: npm run lint OK, npm run build OK

## 2026-02-10 03:10 (Europe/Copenhagen)
- Changed: Added activity streaks by type (run/walk/strength) via new /api/activities/streaks endpoint and small streak pills in Activities card.
- Commit: 90b64ee
- Tests: (not recorded)


## 2026-02-10 03:20 (Europe/Copenhagen)
- Changed: Added app-wide security headers via Next.js headers() (CSP-lite, Permissions-Policy, frame protections, nosniff, referrer-policy; HSTS in prod). Marked backlog item as done.
- Commit: 912f067
- Tests: npm run lint OK, npm run build OK

## 2026-02-10 03:30 (Europe/Copenhagen)
- Changed: Improved first-run Dashboard: when no snapshots exist, we now show a focused empty-state + an optional Manual card (instead of a bunch of empty widgets). Also tightened a11y focus rings (focus-visible) for Input + TogglePill. Marked backlog item #21 as done.
- Commit: 2243116
- Tests: 
pm run lint ?, 
pm run build ?
 
## 2026-02-10 03:42 (Europe/Copenhagen)
- Changed: Added basic CSS design tokens (radii/surfaces/borders/ring/muted text) in globals.css and rewired core UI components (Card/Button/Input/TogglePill) to use them.
- Commit: a0a1c75
- Tests: npm run lint ✅, npm run build ✅

## 2026-02-10 03:54 (Europe/Copenhagen)
- Changed: Added a reusable `Skeleton` UI component and wired skeleton loaders into Dashboard cards (Latest snapshot, Recovery, AI brief) for nicer mobile loading states.
- Commit: dab1288
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 04:00 (Europe/Copenhagen)
- Changed: Added route-level loading UI for authenticated routes via `app/(protected)/loading.tsx` (dashboard-like skeleton during navigation/refresh). Marked backlog item as done.
- Commit: a979b5a
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 04:17 (Europe/Copenhagen)
- Changed: Made `CardHeader` mobile-first by stacking actions below title/description on small screens (avoids cramped button rows).
- Commit: 420199b
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 04:22 (Europe/Copenhagen)
- Changed: Improved the “first snapshot” empty state on /snapshots with step-by-step guidance, expected filename/path for the selected day, and full-width mobile CTAs.
- Commit: d932085
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 04:30 (Europe/Copenhagen)
- Changed: Deferred the heavy “below fold” dashboard section (trends/day plan/activities) using a small `DeferredMount` intersection observer wrapper, so it only mounts when you scroll near it.
- Commit: b09a3f4
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 04:43 (Europe/Copenhagen)
- Changed: Improved empty states on /activities + /alerts with clear mobile CTAs to Snapshots/Dashboard/Garmin.
- Commit: 71891f6
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 04:52 (Europe/Copenhagen)
- Changed: Improved first-snapshot empty state on /snapshots: added a Copy path CTA + reuse expected path string; missing_garmin_file error now offers copy-path + Garmin link.
- Commit: cdcb81f
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 05:00 (Europe/Copenhagen)
- Changed: Added an offline banner (mobile-friendly) when the PWA loses connection, plus a small “Online igen ✓” success toast when connectivity returns.
- Commit: a726917
- Tests: `npm run lint` ✅, `npm run build` ✅
 
## 2026-02-10 05:10 (Europe/Copenhagen) 
- Changed: Improved empty trends CTA: the Trends empty state now links to /snapshots and /garmin (instead of #snapshots anchor), clearer mobile buttons. 
- Commit: bda3539 
- Tests: npm run lint OK, npm run build OK


## 2026-02-10 05:22 (Europe/Copenhagen)
- Changed: Improved dashboard first-snapshot empty state (Latest Snapshot card): shows expected Garmin file path, one-tap copy, and quick links to Garmin/Snapshots.
- Commit: f45b650
- Tests: npm run lint ?, npm run build ?

## 2026-02-10 05:32 (Europe/Copenhagen)
- Changed: Added build info in Settings (app version + git sha) with copy-to-clipboard button. Exposed NEXT_PUBLIC_APP_VERSION + NEXT_PUBLIC_GIT_SHA via next.config.ts.
- Commit: 52cc6b4
- Tests: npm run lint OK, npm run build OK

## 2026-02-10 05:40 (Europe/Copenhagen)
- Changed: Tweaked dashboard “Seneste snapshot” header CTA: button now says “Tag første snapshot” when none, otherwise “Tag nyt snapshot”. Subtitle now hints “Ingen endnu — tag dit første”.
- Commit: fe43543
- Tests: `npm run lint` ✅, `npm run build` ✅


## 2026-02-10 05:52 (Europe/Copenhagen)
- Changed: Refactor: use shared <EmptyState> for TrendsCharts + AI brief empty CTA (first snapshot).
- Commit: 6eba10f
- Tests: `npm run lint` ✅, `npm run build` ✅


## 2026-02-10 06:24 (Europe/Copenhagen)
- Changed: Improved Garmin page empty state when not connected, with clearer CTA to import tokens + links to Snapshots (first snapshot flow). Standardized buttons to UI Button.
- Commit: 67014a5
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 06:35 (Europe/Copenhagen)
- Changed: Improved Recovery card empty state (no snapshots) with clearer 2-step setup instructions + primary “Tag første snapshot” CTA + secondary “Tjek Garmin data”.
- Commit: 952e6b3
- Tests: `npm run lint` ✅, `npm run build` ✅
