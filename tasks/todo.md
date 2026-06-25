# Little Games — Build Plan

A whimsical, mouse-friendly educational web app for a 3-year-old. Static site, no build step,
hosted on GitHub Pages. Extendable game + theme system, well documented.

## Goals
- Big, mouse-friendly targets (hover glow, click ripple, drag) — helps a child learn an external mouse.
- Whimsical animated home background with switchable, original "inspired-by" themes
  (Bat Racers, Blue Pup, Web Hero, Night Heroes, Rainbow).
- Several educational games, added via a simple registry (drop a folder + one import line).
- No copyrighted art. No build tooling. Works on GitHub Pages as plain static files.

## Architecture
- `index.html` — single entry, loads ES modules.
- `css/style.css` — global styles, theme CSS variables, big-target UI.
- `src/core/` — app shell, registry, theme engine, audio, background renderer, game API.
- `src/themes/` — one file per theme + `index.js` aggregator.
- `src/games/<id>/` — one folder per game (`game.js`) + `src/games/index.js` aggregator.

## Tasks
- [x] Confirm scope (themes approach, repo name, first games)
- [x] Scaffold directories
- [x] Core: game API contract (`game-api.js`)
- [x] Core: audio (WebAudio tones + speech synthesis, gesture unlock)
- [x] Core: theme engine + animated background renderer
- [x] Core: registry + app shell (home grid, navigation, theme switcher)
- [x] Themes: 5 original presets
- [x] Game: Animal sounds & ID (reference implementation)
- [x] Game: Bubble pop (mouse trainer)
- [x] Game: Color & shape match
- [x] Game: Music/sound board
- [x] Docs: README + CONTRIBUTING (how to add games/themes)
- [x] Git init, .nojekyll, license, GitHub Pages deploy
- [x] Verify locally, push, enable Pages

## Review

**Status: shipped & live.** https://kingraphaii.github.io/nate-games/

What was built:
- A no-build static site (plain ES modules) that runs as-is on GitHub Pages.
- A small reusable engine in `src/core/`: app shell, game contract (`game-api.js`),
  synthesized audio + speech (`audio.js`), animated themed background (`background.js`),
  confetti (`confetti.js`).
- A registry pattern for both games (`src/games/index.js`) and themes
  (`src/themes/index.js`) — add a folder/file + one import line to extend.
- 5 original "inspired-by" themes (Rainbow, Bat Racers, Blue Pup, Web Hero, Night Heroes)
  + a 🎲 Surprise button; choice persists in localStorage.
- 4 games: Animal Friends, Bubble Pop, Match It, Music Maker — all big-target,
  mouse-friendly, forgiving (never punishing), with sound + reward feedback.
- Docs: README + CONTRIBUTING (how to add games/themes); MIT license.

Verification done:
- `node --check` on all 16 JS files — pass.
- Browser smoke test locally AND on the live URL: home renders, 4 cards / 6 chips,
  theme switch propagates to play screen, Match It + Music Maker open and render,
  **0 console errors/warnings** in both environments.
- GitHub Pages deploy workflow ran green; live site returns HTTP 200.

Ideas for later (not done):
- More games: counting/numbers, letters/phonics, simple drag-to-bucket sorting.
- Optional local-only character art via `assets/private/` (gitignored).
- A parent "settings" gear (volume, which games are visible).
- PWA manifest + service worker for offline/installable use.
