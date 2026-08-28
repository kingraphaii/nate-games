# Upgrade pass — Stage 4: Audio controls (`feat/audio-controls`, issue #7)

Six-stage pass: 1 Foundations ✅ · 2 Deeper quiz games ✅ · 3 Sticker book ✅ ·
4 Audio controls · 5 Recorded sound packs · 6 Visual overhaul + docs sync.
This file tracks the active stage only.

## Checklist

- [x] `audio.js` — `setVolume`/`getVolume` (persisted, drives master gain), speech follows volume
- [x] `audio.js` — `listVoices`/`setVoice` (persisted voiceURI), `_pickVoice` falls back on missing voice
- [x] `index.html` — ⚙️ button + settings popover markup
- [x] `css/style.css` — popover styling (44px targets, accent slider)
- [x] `app.js` — `_wireSettings`: slider, voice select, Test, open/close on outside tap
- [x] `sw.js` CACHE → `little-games-v5`; ROADMAP check-offs
- [x] Verify: slider persists + attenuates; junk voiceURI falls back; mute/unmute keeps level; CI green
- [ ] PR referencing #7

## Review

- Design: volume and mute are independent. The engine keeps a persisted
  `volume` and the mute toggle only forces gain to 0; unmute restores `volume`.
  Speech multiplies its own volume by the master so the slider governs it too
  (best-effort on iOS, which may ignore utterance volume).
- Voice fallback: `_pickVoice` honors a saved voiceURI only when it still exists
  on the device, otherwise it re-runs the heuristic. Verified a bogus URI falls
  back to "Samantha" with no error.
- Browser proof: slider → 0.3 persisted, master gain followed, survived a
  reload; mute→0 then unmute→0.3 (kept the chosen level, not the default);
  outside tap closes the popover; the voice list built 41 English voices on
  open; the popover fits a 375px viewport (left 19, right 287). Console clean.
- Deferred (as planned): background music loop, parent gate on the popover.
