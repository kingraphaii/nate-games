# 🗺️ Roadmap & Ideas

A living backlog of where **Little Games** can go next — so there's always
something to reach for. Nothing here is committed work; pick whatever sounds fun.
Check items off as they ship, and add your own.

> **How to use this:** each idea is small and self-contained. When you want to
> build one, see [CONTRIBUTING.md](CONTRIBUTING.md) — most games are "one folder,
> one file, one import line." Rough effort tags: 🟢 small · 🟡 medium · 🔴 larger.

---

## ✅ Already built

Games: Animal Friends · Bubble Pop · Balloon Bash · Trace Trails · Match It ·
Count With Me · Letter Sounds · Music Maker.
Engine: theme system (5 presets + Surprise) · synthesized audio + speech ·
animated background · confetti · combo/juice system · global mute.

---

## 🎮 New game ideas

- [ ] 🟢 **Shapes & Sorting** — drag shapes into matching holes (shape-sorter toy). Teaches shapes + drag control.
- [ ] 🟢 **Memory Match** — flip cards to find pairs (animals, fruits). Teaches memory + concentration. Start with 4–6 cards.
- [ ] 🟢 **Colors** — "Tap the red one!" across a tray of colored blobs. Pure color naming (split out from Match It).
- [ ] 🟡 **Big & Small / Opposites** — tap the big one vs the small one; hot/cold, up/down. Early comparison concepts.
- [ ] 🟡 **Dot-to-Dot** — click numbered dots in order to reveal a picture. Combines counting + the mouse path.
- [ ] 🟡 **Simple Puzzle** — drag 2–4 big pieces into place to complete a picture.
- [x] 🟡 **Peekaboo / Cause & Effect** — open curtained windows to reveal a hidden, show-inspired friend + cheer. Great for the very youngest. ✅ shipped (`src/games/peekaboo/`)
- [ ] 🟡 **Weather & Seasons** — tap the sun/rain/snow; dress the character for the weather.
- [ ] 🟡 **Body Parts** — "Where is the nose?" on a friendly face. Vocabulary + pointing.
- [ ] 🔴 **Simple Maze** — guide a character to the goal by moving the mouse. Advanced mouse control.
- [ ] 🔴 **Rhythm Tap** — tap pads in time to a simple beat (builds on Music Maker).

## 🔧 Tweaks to existing games

- [ ] 🟢 **Count With Me — bigger range.** Add an easy/hard toggle: 1–5 (now) vs **1–10**. The grid + notes already scale; just raise `MAX_COUNT` behind a difficulty setting.
- [ ] 🟢 **Letter Sounds — letter subsets.** Optional "just the letters in my name" or "A–F first" mode so a new learner isn't shown all 26 at once. Could also add a lowercase mode (a/A).
- [ ] 🟢 **Match It — more shapes/colors,** and a "shape only" or "color only" mode to isolate one concept.
- [ ] 🟢 **Animal Friends — more animals** and an optional real-animal-sound pack (kept as local-only assets; see Personalization).
- [ ] 🟡 **Per-game difficulty** — a shared, tiny `difficulty` setting (easy/medium) games can read from `ctx`, instead of hard-coded constants. See Architecture below.
- [ ] 🟡 **Replay/▶ Next buttons** consistently across all round-based games.

## 🎨 Themes & visuals

- [ ] 🟢 **More theme presets** — Ocean, Space, Dino, Farm, Princess, Construction. One file each (see CONTRIBUTING).
- [ ] 🟢 **Per-theme cursor** — themed pointer art to match the background.
- [ ] 🟡 **Theme-aware game art** — let games pull accent colors/glyphs from the active theme more deeply.
- [ ] 🟡 **Reduced-motion polish** — audit every animation under `prefers-reduced-motion` (background already respects it).

## 🔊 Audio

- [ ] 🟢 **Volume slider** (not just mute) in the controls.
- [ ] 🟡 **Voice picker** — let a grown-up choose the speech voice/accent; remember it.
- [ ] 🟡 **Optional background music** — a soft, loopable synthesized tune with its own toggle.
- [ ] 🟡 **Better phonics audio** — some browser voices say "buh" oddly; consider per-letter tuned utterances or short recorded clips (local assets).

## ♿ Accessibility & little-kid UX

- [ ] 🟢 **Even bigger hit targets / spacing** option for the youngest hands.
- [ ] 🟡 **Keyboard + switch support** — full play via Tab/Enter/Space and arrow keys (some of this exists via buttons).
- [ ] 🟡 **High-contrast theme** for low vision.
- [ ] 🟡 **First-visit "how to play"** — a tiny animated hand showing "move the mouse, then click."

## 👨‍👩‍👧 Grown-up / parent features

- [ ] 🟡 **Settings panel** (gear icon) — volume, difficulty, which games are visible, reduced motion.
- [ ] 🟡 **Parent gate** — a simple "tap the three circles" lock on settings so a toddler can't change them.
- [ ] 🟡 **Hide/show & reorder games** — choose which cards appear on the home screen.
- [ ] 🔴 **Gentle progress notes** — local-only "played counting 12 times" stats for a parent (no accounts, nothing leaves the device).
- [ ] 🟢 **Kiosk tip in-app** — surface the "F11 full-screen" tip somewhere discoverable.

## 📦 Platform & infrastructure

- [ ] 🟡 **PWA / offline** — add a manifest + service worker so it installs to the home screen and works without internet (great for car/plane). All assets are local already.
- [ ] 🟢 **Open Graph / share image** — a nice preview card when the link is shared.
- [ ] 🟡 **Performance pass** — cap devicePixelRatio, pause RAF when a game is idle, lighten the background on low-end devices.
- [ ] 🟡 **Lighthouse / a11y CI** — add a check to the deploy workflow.

## 🧩 Code & architecture (developer experience)

- [ ] 🟢 **Per-game README/meta** — short notes in each game folder.
- [ ] 🟡 **Shared difficulty + settings in `ctx`** — central place games read difficulty, volume, etc. (powers several tweaks above).
- [ ] 🟡 **A round-based game helper** — Animal/Match/Count/Letters share a lot (prompt, "Say again", win → next). Factor a small `core/round.js` so new quiz-style games are even shorter. (Don't over-abstract — only if it stays simpler.)
- [ ] 🟡 **A tiny test harness** — smoke-load each game module and assert it mounts/unmounts cleanly (catches registry/contract breaks).
- [ ] 🟢 **Asset pipeline note** — document where optional local images/sounds go.

## 🎨 Personalization (kept private)

- [ ] 🟢 **Local-only character art** — drop personal/licensed images in `assets/private/` (already git-ignored) and theme the background with them, without committing anything to the public repo.
- [ ] 🟡 **Custom word lists** — let a parent add their child's favorite animals/words locally.

---

### Picking what's next

Good high-value, low-effort starters: **Memory Match**, **Shapes & Sorting**,
**Count With Me 1–10 toggle**, and a couple of **new themes**. Bigger wins for
real-world use: **PWA/offline** and a **parent settings panel**.
