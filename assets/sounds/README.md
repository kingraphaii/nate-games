# Adding recorded sounds

The games play optional recorded clips and fall back to a synthesized sound for
any file that is not here — so this folder can stay empty or fill up over time.

## Layout

```
assets/sounds/
├── animals/   cow.mp3  dog.mp3  ...   (filename = the animal name, lowercased)
├── phonics/   a.mp3  b.mp3  ... z.mp3 (filename = the lowercase letter)
└── CREDITS.md                          (one line per file — CI enforces it)
```

## Every new file needs four things

1. The `.mp3` in `animals/` or `phonics/` with the exact filename above.
2. Its base name added to the right array in `manifest.json` (this is what the
   games read to decide which clips exist, so nothing 404s).
3. A line in `assets/sounds/CREDITS.md` (source, author, license, edits).
4. An entry in the `ASSETS` list in `sw.js`, and a `CACHE` bump.

`node tools/check-sw.mjs` fails if any of these is missing — including a
manifest entry that has no file, or a file missing from the manifest.

## Format

Mono MP3, 44.1 kHz, 64–96 kbps, ≤ 2 s, loudness-matched. MP3 (not Ogg) because
iOS Safari's `decodeAudioData` does not decode plain Ogg Vorbis.

Convert on macOS:

```bash
ffmpeg -i in.wav -ac 1 -ar 44100 -b:a 80k -t 2 animals/cow.mp3
```

## Sourcing

- **Animals** — freesound.org with the license filter set to **Creative
  Commons 0**, or Wikimedia Commons files marked **Public Domain / CC0**. Verify
  the license on each file's own page. Not BBC Sound Effects (non-commercial).
- **Phonics** — record them (say *buh*, not *bee*). Original recordings have no
  license question and give one consistent, friendly voice.
