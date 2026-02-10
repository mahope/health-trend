# Health Trend — Backlog (autopilot)

**Mode:** mobile-first (mest brugt på telefon)

## Now (Mads’ 3 requests)
- [x] **Light design** as default + optional dark mode toggle
- [x] **Better header** (avatar + settings + sign out)
- [x] **Full PWA** (install-only)

## Next (20 ideas)

### Settings / personalisation
- [x] Sex + cycle context used in AI prompts (brief)
- [x] Sex + cycle context used in AI prompts (day plan)
- [x] Sex + cycle context used in AI prompts (weekly report)
- [x] Cycle tracking UI (period start, cycle length estimate, symptoms)

### Data hygiene
- [x] Delete snapshots (done ✅) + undo within 30s (optional)
- [x] “Recompute” day brief after deleting snapshots
### Mobile UX
1. [x] Toasts/haptics for Snapshot/Brief/Save
2. [x] Manual autosave status (Gemmer… / Gemt ✓)
- [x] Pull-to-refresh on mobile
4. [x] “Quick chips” for manual (koffein +1, alkohol +1, symptom +1)
5. [x] Better empty states + CTA (first snapshot)
6. [x] Performance: defer heavy sections below fold

### Garmin value
7. [x] Sleep debt trend chart (7/14d)
8. [x] Recovery score widget (BB low + stress + sleep)
9. [x] Activity streaks by type (walk/run/strength)
10. [x] Best-days patterns: what correlates with LOW risk
11. [x] “Tomorrow plan” (based on today)

### AI
12. [x] AI: 1-line coach in header
13. [x] AI: weekly review save/share
14. [x] AI: suggest what to track manually next (based on signals)
15. [x] AI: detect ‘overstimulation’ pattern (manual+time)

### Security/ops
- [x] Rate limiting on manual upsert + auth endpoints
17. [x] Health endpoint + basic uptime page
18. [x] Better cron logging + idempotency key
19. [x] Security headers (CSP-lite, etc.)

### Design/system
20. [x] Design tokens (spacing/typography) pass
21. [x] Input/Button focus states (a11y)
22. [x] Skeleton loaders for cards
23. [x] Route-level loading skeleton for protected pages (Next.js loading.tsx)

## Autopilot log
See `AUTOPILOT_LOG.md`
