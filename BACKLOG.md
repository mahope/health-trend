# Health Trend — Backlog (autopilot)

**Mode:** mobile-first (mest brugt på telefon)

## Now (Mads’ 3 requests)
- [x] **Light design** as default + optional dark mode toggle
- [x] **Better header** (avatar + settings + sign out)
- [x] **Full PWA** (install-only)

## Next (20 ideas)

### Settings / personalisation
- [ ] Sex + cycle context used in AI prompts (brief + day plan + weekly report)
- [ ] Cycle tracking UI (period start, cycle length estimate, symptoms)

### Data hygiene
- [ ] Delete snapshots (done ✅) + undo within 30s (optional)
- [ ] “Recompute” day brief after deleting snapshots
### Mobile UX
1. Toasts/haptics for Snapshot/Brief/Save
2. Manual autosave status (Gemmer… / Gemt ✓)
3. Pull-to-refresh on mobile
4. “Quick chips” for manual (koffein +1, alkohol +1, symptom +1)
5. Better empty states + CTA (first snapshot)
6. Performance: defer heavy sections below fold

### Garmin value
7. Sleep debt trend chart (7/14d)
8. Recovery score widget (BB low + stress + sleep)
9. Activity streaks by type (walk/run/strength)
10. Best-days patterns: what correlates with LOW risk
11. “Tomorrow plan” (based on today)

### AI
12. AI: 1-line coach in header
13. AI: weekly review save/share
14. AI: suggest what to track manually next (based on signals)
15. AI: detect ‘overstimulation’ pattern (manual+time)

### Security/ops
16. Rate limiting on manual upsert + auth endpoints
17. Health endpoint + basic uptime page
18. Better cron logging + idempotency key
19. Security headers (CSP-lite, etc.)

### Design/system
20. Design tokens (spacing/typography) pass
21. Input/Button focus states (a11y)
22. Skeleton loaders for cards

## Autopilot log
See `AUTOPILOT_LOG.md`
