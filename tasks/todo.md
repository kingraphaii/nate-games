# Upgrade pass — Stage 3: Sticker book (`feat/sticker-book`, issue #5)

Six-stage pass: 1 Foundations ✅ · 2 Deeper quiz games ✅ · 3 Sticker book ·
4 Audio controls · 5 Recorded sound packs · 6 Visual overhaul + docs sync.
This file tracks the active stage only.

## Checklist

- [x] `core/stickers.js` — catalog (10 sets × 8), `awardSticker`, unlock overlay, mini-cheer
- [x] `games/stickers/game.js` — the 📖 Sticker Book, registered first on the home grid
- [x] `ctx.award()` in app.js; award calls: quiz wins (round.js), numbers finish,
      peekaboo reveal, bubbles/balloons/fruit every 10 points, trace shape,
      music every 16 taps + finished song
- [x] `sw.js` — +2 files, CACHE → `little-games-v4`
- [x] README — game table row + tree
- [x] Verify: 3 wins → unlock overlay → sticker in book → survives reload;
      overlay passes taps through; complete-set path clean; book scrolls
- [ ] PR referencing #5

## Review

- Design note: stickers.js takes its confetti + audio through `initStickers`,
  not an import. The Sticker Book is a registered game, so the smoke test loads
  it in node — an `audio.js` import would touch `window` and break CI.
- Browser proof: the third Animal Friends win unlocked "Giraffe"; the overlay is
  `pointer-events:none` and auto-dismisses; the book showed 1 earned + 79 locked
  and survived a reload; a tapped sticker speaks its name; 24 fruit milestones
  earned all 8, and 6 more past the full set logged no error; console clean.
- Pacing: every 3rd milestone unlocks. Arcade games award every 10th point, so a
  sticker there is ~30 points — a real session, not a giveaway.
