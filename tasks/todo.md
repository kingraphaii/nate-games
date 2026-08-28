# Upgrade pass — Stage 2: Deeper quiz games (`feat/deeper-quiz-games`, issue #3)

Six-stage pass: 1 Foundations ✅ · 2 Deeper quiz games · 3 Sticker book ·
4 Audio controls · 5 Recorded sound packs · 6 Visual overhaul + docs sync.
This file tracks the active stage only.

## Checklist

- [x] `core/round.js` — `modeChips` (persisted chip groups) + `shell.started()`
- [x] Match It — migrate to round.js; +oval/diamond/moon, +pink/teal/brown; Both/Shapes/Colors chips
- [x] Count With Me — quizShell adoption; 1–5 / 1–10 chip; words + notes to ten; dwell on items
- [x] Letter Sounds — migrate to round.js; A–F / A–M / All chips; ABC / abc toggle
- [x] Animal Friends — cast 12 → 20 (data only)
- [x] `sw.js` CACHE → `little-games-v3`
- [x] Verify: chips persist across reload; pools respected; browser test per game; CI green
- [ ] PR referencing #3

## Review

- The "crescent" shape ships as **moon** — that is the word a 3-year-old says.
- One bug found and fixed during browser testing: shape mode said
  "Find the the diamond!" (a doubled article in the label helper).
- Browser proof: A–F mode sampled 45 cards across 15 rounds and showed exactly
  A–F; lowercase renders lowercase glyphs; the 1–10 chip produced rounds of 7,
  8, and 9 items with a clean wrap; 25 animal rounds sampled all 20 cast
  members; exits mid-celebration stay silent; the console stayed clean.
