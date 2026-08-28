# Upgrade pass — Stage 1: Foundations (`chore/foundations`, issue #1)

Six-stage pass: 1 Foundations · 2 Deeper quiz games · 3 Sticker book ·
4 Audio controls · 5 Recorded sound packs · 6 Visual overhaul + docs sync.
This file tracks the active stage only.

## Checklist

- [ ] `tools/smoke.mjs` — import game + theme registries, assert ids and palettes
- [ ] `tools/check-sw.mjs` — ASSETS completeness, dead entries, CACHE bump vs origin/main
- [ ] `.github/workflows/ci.yml` — syntax check + smoke + check-sw
- [ ] `src/core/store.js` — localStorage wrapper with in-memory fallback
- [ ] `src/core/round.js` — quizShell + pickOneRound (managed timers, dwell, Next)
- [ ] Migrate `src/games/animals/game.js` (fixes the speech-after-exit leak)
- [ ] `src/core/app.js` — `ctx.settings` (per-game, on store.js)
- [ ] `sw.js` — add store.js + round.js, bump CACHE → `little-games-v2`
- [ ] Docs: README table/tree, ROADMAP shipped items, CONTRIBUTING checklist
- [ ] Verify: CI checks fail on seeded errors; browser test (leak, dwell, tap, re-open)
- [ ] PR referencing #1

## Review

(filled at the end of the stage)
