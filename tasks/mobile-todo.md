# Make Little Games mobile-friendly (pre-PWA)

Goal: the app + all games work well on a phone, ready to wrap as an installable PWA tomorrow.
Input already uses Pointer Events, so taps/drags/clicks work — the gaps are viewport/CSS/gesture level.

- [x] index.html: `viewport-fit=cover` + iOS web-app status-bar meta
- [x] style.css: `100dvh` heights (body/.screen) so the address bar doesn't crop content
- [x] style.css: safe-area padding for controls, play-bar, home-header, footer (notch / home indicator)
- [x] style.css: `touch-action: manipulation` + `overscroll-behavior: none` on body; `touch-action: none` on `.play-area`
- [x] style.css: guard hover-lift rules with `@media (hover: hover)` (no sticky hover on touch); cursor too
- [x] style.css: 2-column game grid under 560px
- [x] activatable.js: only run the dwell ring for `pointerType === 'mouse'`/`pen`
- [x] app.js: update `<meta theme-color>` when the theme changes (mobile status bar)

## Review
Done & verified at a 390×844 viewport (home + Trace play screen screenshots; `.play-area`
computes `touch-action: none`).

Key insight: input was already mobile-capable because every game uses **Pointer Events**
(`pointerdown`/`pointermove`/`click`), which unify mouse + touch. Taps, finger-drags
(Fruit slice, Trace), and the music/dance modes all work without JS changes. The fixes were
viewport/CSS/gesture-level, not input-level.

Notes for tomorrow's PWA pass:
- `.play-area { touch-action: none }` cascades to descendants, so Trace/Fruit drag is covered
  without per-game edits.
- In-game card `:hover` lifts (animals/letters/match/numbers/peekaboo/music) are NOT guarded
  with `@media (hover:hover)` — they're masked because tapping a card immediately re-renders
  that screen, so sticky-hover isn't visible. Revisit only if it shows up in real use.
- `apple-mobile-web-app-status-bar-style: black-translucent` pairs with the safe-area-inset-top
  padding so standalone-mode content sits below the status bar.
- Custom mouse cursor is now gated behind `@media (hover: hover)`.

## Next (PWA — separate task)
- `manifest.webmanifest` (name, short_name, start_url, display: standalone, theme/bg color, icons)
- App icons (192 / 512 / maskable) + apple-touch-icon
- Service worker: precache the static shell (HTML/CSS/JS modules) for offline + installability
- Register the SW from app.js; link the manifest from index.html
