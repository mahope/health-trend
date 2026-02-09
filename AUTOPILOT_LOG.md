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
