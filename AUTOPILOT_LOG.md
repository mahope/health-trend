# Autopilot Log

Autopilot writes short entries here.

## 2026-02-09 22:00 (Europe/Copenhagen)
- Changed: UserMenu now closes on outside click + Esc. Marked the 3 “Now” backlog items as done. Added `scripts/kill-port-3000.ps1` helper.
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
- Changed: Added quick chips in Manual form for +1 koffein/+1 alkohol/+1 symptom (capped at 3) + a small “nulstil” action. Marked backlog item as done.
- Commit: 02f73fc
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:22 (Europe/Copenhagen)
- Changed: Improved first-run empty state for snapshots: added a clear “Tag første snapshot” CTA (mobile-friendly) + nicer error box that shows hint/file path when Garmin JSON is missing.
- Commit: 5f6141f
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:33 (Europe/Copenhagen)
- Changed: Added empty state + CTA in Trends charts when there’s no data yet (links to “Snapshots” section). Added `id="snapshots"` anchor on dashboard.
- Commit: e01f307
- Tests: `npm run lint` ✅, `npm run build` ✅

## 2026-02-10 00:40 (Europe/Copenhagen)
- Changed: Improved first-run empty states: AI brief card now guides snapshot/manual first with CTAs; Activities card now has a clearer “Tag snapshot” CTA. Also deferred heavy Recharts trends charts into a lazy-loaded client boundary (`DashboardBelowFold`) for faster initial render. Marked backlog perf item as done.
- Commit: c4b50ac
- Tests: `npm run lint` ✅, `npm run build` ✅
