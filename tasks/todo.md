# Upgrade pass — Stage 5: Recorded sound packs (`feat/recorded-sounds`, issue #9)

Six-stage pass: 1 Foundations ✅ · 2 Deeper quiz games ✅ · 3 Sticker book ✅ ·
4 Audio controls ✅ · 5 Recorded sound packs · 6 Visual overhaul + docs sync.
This file tracks the active stage only.

## Checklist

- [x] `audio.js` — `preload`/`playSample` (decode cache, play through master, synth fallback)
- [x] `audio.js` — `soundManifest`/`preloadSet` (only fetch clips that exist → no 404 noise)
- [x] `assets/sounds/` — manifest.json, CREDITS.md, README.md, animals/ + phonics/ (.gitkeep)
- [x] Animals win plays real sound (fallback: spoken sentence); Letters plays phonics clip (fallback: spoken phonics)
- [x] `check-sw.mjs` — sound files need a CREDITS line; manifest must match disk (both directions)
- [x] `sw.js` — precache manifest.json, CACHE → `little-games-v6`; ROADMAP check-offs
- [x] Verify: empty manifest → 0 mp3 fetches; playSample plays a cached buffer; fallback speaks; CI gates fire
- [ ] PR referencing #9

## Owner follow-up (Percy adds files incrementally)

- Animals: CC0 clips from freesound.org (CC0 filter) or Wikimedia PD/CC0.
- Phonics: record ~26 clips (say *buh*, not *bee*), convert to mono MP3.
- Each new file: add to `animals/` or `phonics/`, add its base name to
  `manifest.json`, add a `CREDITS.md` line, add to `sw.js` ASSETS + bump CACHE.
  CI enforces all four.

## Review

- The manifest was added mid-stage to fix real console noise: without it, every
  Animals/Letters visit fetched all candidate clips and logged ~46 console 404s.
  The manifest gates preloading to files that exist; empty → zero mp3 fetches.
  `check-sw` validates it matches disk both ways, so it cannot drift.
- One test-harness gotcha found: the CREDITS check used a bare substring match,
  so the format example (`animals/cow.mp3`) masked a real missing credit. Fixed
  to match the backticked token and changed the example to `<name>.mp3`.
- Browser proof: `preloadSet` with the empty manifest made 0 mp3 fetches (only
  manifest.json, 200); `playSample` played an injected buffer (returned true)
  and ran the fallback for a missing url; Animals and Letters wins spoke via
  fallback; the reveal showed. CI gate branches all verified.