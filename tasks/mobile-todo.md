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

## PWA pass (done 2026-06-26)
- [x] `manifest.webmanifest` (name, short_name, start_url ".", scope ".", display: standalone, theme/bg color, icons)
- [x] App icons (192 / 512 / maskable) + apple-touch-icon — vector gamepad on aqua gradient
- [x] Service worker (`sw.js`): precache the full static shell (all 25 JS modules + HTML/CSS/icons) for offline + installability; stale-while-revalidate runtime strategy
- [x] Register the SW from app.js; link the manifest + apple-touch-icon from index.html

### PWA review
Verified in a real browser at `localhost`: SW registers with scope `/` (state `activated`,
controlling the page), manifest parses as "Little Games", apple-touch-icon linked. **Offline
test passed** — with the server killed, a reload rendered the full app (10 game cards, 6 theme
chips) entirely from cache.

Key decisions:
- **Relative paths everywhere** (`start_url "."`, `register(new URL('sw.js', document.baseURI))`,
  relative precache list) so it works both locally and under the `/nate-games/` Pages base path.
- **Icons built without emoji/SVG-gradient deps.** ImageMagick's internal SVG renderer ignores
  `url(#gradient)` fills, so `assets/controller.svg` (white gamepad, transparent bg) is composited
  onto an IM-generated gradient. Regenerate with `assets/build-icons.sh`.
- **Precache = whole app.** Every game/theme is statically imported at boot, so the install-time
  list is the entire module graph — no lazy chunks to miss. Bump `CACHE` in `sw.js` to ship updates.
- Workflow already uploads the whole repo to Pages, so the new files deploy with no CI change.
