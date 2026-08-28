# Upgrade pass — Stage 6: Visual overhaul + docs sync (`feat/visual-overhaul`, issue #11)

Six-stage pass: 1 Foundations ✅ · 2 Deeper quiz games ✅ · 3 Sticker book ✅ ·
4 Audio controls ✅ · 5 Recorded sound packs ✅ · 6 Visual overhaul (final).
This is the last stage.

## Checklist

- [x] New themes: ocean, space, dino, farm (registered)
- [x] Per-theme cursor — generated from palette.primary, `--cursor` + CSS fallback
- [x] Theme-aware cards — `--card-bg` slot; animals/match/numbers use it
- [x] Reduced-motion — confetti thins to ~40% + shorter life; DOM anims already neutralized
- [x] Fix: dark-theme mode chips were white-on-white; now `var(--surface)` (also fixes Stage 2 dark themes)
- [x] `sw.js` — 4 theme files in ASSETS, CACHE → `little-games-v7`
- [x] Docs: README (themes, audio, controls, tree), ROADMAP check-offs, CONTRIBUTING card slot
- [x] Verify: 9 theme chips; card-bg + cursor per theme; contrast on light + dark; confetti reduction
- [ ] PR referencing #11

## Review

- Found and fixed a real contrast bug uncovered by the two new dark themes: the
  Stage-2 mode chips hard-coded a white background with `var(--text)`, so on any
  dark theme (Space, Bat Racers, Night Heroes) an inactive chip was near-white
  text on white — invisible. Now they use `var(--surface)` like the home chips.
- Cursor is generated from the palette (white body + themed outline), so it
  themes for free with no per-theme data and the shape/hotspot never change.
- Existing themes keep the `#fff` card fallback (no churn); only the new light
  themes tint their cards.
- Browser proof: all 9 theme chips present and applied; `--card-bg`/`--cursor`
  set per theme (Farm outline #e0533d, Space #ffd400); Match It readable on Farm
  (cream cards) and Space (dark surface, legible chips after the fix); confetti
  28→11 particles with life 0.7 under reduced motion.

## Pass complete after merge

All six stages shipped. Recorded audio files remain an incremental owner task
(see assets/sounds/README.md).