# 🎮 Little Games

A whimsical, **mouse-friendly** collection of educational mini-games for little kids
(built for a 3-year-old). It runs as a plain static website — no build step, no
server — and is hosted free on **GitHub Pages**.

**▶ Play:** https://kingraphaii.github.io/nate-games/

---

## What it does

- **Big, forgiving click targets** with obvious hover/press feedback — perfect for a
  toddler learning to use an external mouse.
- **Whimsical animated background** that you can switch between original, kid-friendly
  themes (or hit **🎲 Surprise** for a random one). Themes are *inspired by* shows young
  kids love — Bat Racers, Blue Pup, Web Hero, Night Heroes, Rainbow — using original colours
  and shapes only (no copyrighted art, so it's safe to host publicly).
- **Several games**, reachable from one home screen:
  | Game | What it teaches |
  |------|-----------------|
  | 🐮 **Animal Friends** | Listen and click the right animal — vocabulary + listening |
  | 🫧 **Bubble Pop** | Pop floating bubbles (with combos) — pure mouse-control practice |
  | 🎈 **Balloon Bash** | Burst balloons for points — aiming + the joy of a hot streak |
  | ✏️ **Trace Trails** | Follow a path with the pointer — fine mouse control |
  | 🔶 **Match It** | Find the matching colour & shape — shapes, colours, aiming |
  | 🔢 **Count With Me** | Tap and count 1–5 — counting + one-to-one correspondence |
  | 🔤 **Letter Sounds** | Find a letter, learn its phonics sound — alphabet + reading |
  | 🎹 **Music Maker** | Tap buttons to play notes — cause-and-effect + music |
- **All sound is synthesized** (Web Audio) or spoken (browser speech synthesis), so there
  are **no audio files** to download or license.
- Works offline-friendly, respects `prefers-reduced-motion`, and has a global **mute** button.

## How to run it locally

Because it uses ES modules, open it through a tiny local web server (not `file://`):

```bash
# any one of these, from the project folder:
python3 -m http.server 8000      # then visit http://localhost:8000
npx serve .                      # or any static server you like
```

Then open **http://localhost:8000** in a browser.

> Tip for the grown-up: full-screen the browser (F11) so a little one can't wander off into tabs,
> and use the on-screen **🔊/🔇** button to mute when needed.

## Project layout

```
nate-games/
├── index.html              # single entry point
├── css/style.css           # global styles + theme variables + big-target UI
├── src/
│   ├── core/               # the reusable engine
│   │   ├── app.js          # app shell: home grid, navigation, theme switching
│   │   ├── game-api.js     # the contract every game implements (+ helpers)
│   │   ├── audio.js        # synthesized tones + speech (no audio files)
│   │   ├── background.js   # animated themed home background (canvas)
│   │   ├── confetti.js     # celebratory particle bursts
│   │   └── juice.js        # shared "game feel": combos, multipliers, floating score
│   ├── themes/             # one file per theme + index.js registry
│   │   ├── index.js
│   │   ├── rainbow.js  bat-racers.js  blue-pup.js  web-hero.js  night-heroes.js
│   └── games/              # one folder per game + index.js registry
│       ├── index.js
│       ├── animals/  bubbles/  balloons/  trace/  match/  numbers/  letters/  soundboard/
├── .github/workflows/deploy.yml   # auto-deploys to GitHub Pages on push
├── CONTRIBUTING.md         # how to add new games and themes
└── ROADMAP.md              # backlog of next-step ideas & improvements
```

## Adding more games or themes

It's designed to grow. See **[CONTRIBUTING.md](CONTRIBUTING.md)** — adding a game is
"make a folder, write one file, add one import line." Adding a theme is even smaller.

For a running list of **next-step ideas and improvements** (new games, difficulty
tweaks, themes, offline/PWA, a parent settings panel, and more), see
**[ROADMAP.md](ROADMAP.md)** — there's always something to reach for.

## Deployment

Every push to `main` is deployed automatically by the GitHub Actions workflow in
`.github/workflows/deploy.yml`. The live site updates a minute or two after pushing.

## License

[MIT](LICENSE). Themes are original works inspired by, but not copied from, various
children's shows; no third-party characters, logos, or assets are included.
