# Upgrade pass — Stage 1: Foundations (`chore/foundations`, issue #1, PR #2)

Six-stage pass: 1 Foundations · 2 Deeper quiz games · 3 Sticker book ·
4 Audio controls · 5 Recorded sound packs · 6 Visual overhaul + docs sync.
This file tracks the active stage only.

## Checklist

- [x] `tools/smoke.mjs` — import game + theme registries, assert ids and palettes
- [x] `tools/check-sw.mjs` — ASSETS completeness, dead entries, CACHE bump vs origin/main
- [x] `.github/workflows/ci.yml` — syntax check + smoke + check-sw
- [x] `src/core/store.js` — localStorage wrapper with in-memory fallback
- [x] `src/core/round.js` — quizShell + pickOneRound (managed timers, dwell, Next)
- [x] Migrate `src/games/animals/game.js` (fixes the speech-after-exit leak)
- [x] `src/core/app.js` — `ctx.settings` (per-game, on store.js)
- [x] `sw.js` — add store.js + round.js, bump CACHE → `little-games-v2`
- [x] Docs: README table/tree, ROADMAP shipped items, CONTRIBUTING checklist
- [x] Verify: CI checks fail on seeded errors; browser test (leak, dwell, tap, re-open)
- [x] PR referencing #1 → PR #2, CI green

## Review

- Animal Friends shrank from 117 to 87 lines and keeps only data + card styles.
- The five seeded CI failures each produced a clear, specific error message.
- Browser proof: after exit mid-celebration, `speechSynthesis.speaking` is false
  and the play area is empty; dwell fires the card without a click; ▶ Next deals
  a fresh round; untouched games run with a clean console.
- Next stage after merge: `feat/deeper-quiz-games` (match, numbers, letters,
  bigger animal cast, mode chips).
