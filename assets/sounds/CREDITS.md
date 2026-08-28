# Sound credits

Every audio file under `assets/sounds/` is listed here with its source and
license. CI (`tools/check-sw.mjs`) fails if a sound file has no entry, so this
ledger stays complete.

Format, one bullet per file:

```
- `animals/<name>.mp3` — Source: <url> · Author: <name> · License: CC0 · Edits: trimmed to 1.4s, normalized
```

Rules:

- Animals: **CC0 / Public Domain only** (freesound.org with the CC0 filter, or
  Wikimedia Commons files marked PD/CC0). Not BBC Sound Effects (non-commercial
  only). Avoid "free" licenses that forbid redistributing the raw file.
- Phonics: original recordings (say *buh*, not *bee*). No third-party license,
  so note `Author: recorded in-house · License: original`.
- Format: mono MP3, 44.1 kHz, ≤ 2 s, loudness-matched. MP3 because iOS Safari
  `decodeAudioData` does not decode plain Ogg Vorbis.

The games fall back to a synthesized sound for any file not present, so clips
can be added incrementally.

## Animals

_No recorded animal sounds yet — every animal uses its synthesized sound._

## Phonics

_No recorded phonics clips yet — every letter uses its synthesized phonics._
