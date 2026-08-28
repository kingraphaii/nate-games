# Extending Little Games

This project is built to grow. There's **no build step and no framework** — just ES
modules and the browser. Two things you'll add most often: **games** and **themes**.

---

## Add a new game

A game is one folder with one file.

### 1. Create the folder + file

```
src/games/<your-id>/game.js
```

### 2. Export a game object

```js
// src/games/dino/game.js
export default {
  id: 'dino',                       // unique, matches the folder name
  title: 'Dino Stomp',              // shown on the home card
  emoji: '🦕',                       // big icon on the card
  blurb: 'Stomp the dinos!',        // one-line description (optional)
  tags: ['mouse'],                  // optional, for future filtering

  // Build your UI inside `root` (an empty <div> that fills the play area).
  // `ctx` gives you everything you need (see below).
  mount(root, ctx) {
    root.innerHTML = `<button class="big-prompt">Stomp! 🦕</button>`;
    const btn = root.querySelector('button');
    const onClick = (e) => {
      ctx.audio.pop();                 // play a sound
      ctx.confetti(e.clientX, e.clientY); // celebrate
      ctx.speak('Stomp!');             // say a word out loud
    };
    btn.addEventListener('click', onClick);

    // Return a cleanup function — stop timers, RAF loops, and remove any
    // listeners you put on window/document. (Listeners on elements inside
    // `root` are cleaned up automatically when the play area is cleared.)
    return () => btn.removeEventListener('click', onClick);
  },
};
```

### 3. Register it — three places

1. Open `src/games/index.js`, import your game, and add it to the `GAMES` array:

```js
import dino from './dino/game.js';
// ...
export const GAMES = [animals, bubbles, match, dino].map(assertValidGame);
```

2. Add the file to the `ASSETS` list in `sw.js` (so it works offline).
3. Bump the `CACHE` constant in `sw.js` (e.g. `little-games-v2` → `little-games-v3`)
   so installed apps pick up the change.

CI enforces steps 2 and 3 — a missing `ASSETS` entry or a forgotten bump fails
the build. The game appears on the home screen automatically. Refresh the page.

> 💡 The best starting point is to **copy `src/games/animals/game.js`** — it's the
> reference implementation and shows the round-based pattern, scoped CSS injection,
> and cleanup done right.

### The `ctx` (GameContext) your game receives

| Property | Description |
|----------|-------------|
| `ctx.audio` | The shared sound engine. `pop({pitch})`, `cheer()`, `oops()`, `note('C4', opts)`, `chord([...])`, `melody([[note,dur],...])`, `tone(freq, opts)`. All synthesized — no files. |
| `ctx.speak(text, opts)` | Say a word/sentence aloud (browser speech). `opts`: `{ rate, pitch, volume }`. |
| `ctx.confetti(x, y, opts)` | Burst celebratory particles at screen point `(x, y)` — use `e.clientX/clientY`. |
| `ctx.theme` / `ctx.palette` | The active theme and its colour palette (e.g. `ctx.palette.primary`). |
| `ctx.shuffle(arr)` | Returns a shuffled **copy** of an array. |
| `ctx.pick(arr)` | Returns a random element. |
| `ctx.activatable(el, onActivate, opts)` | Make an element fire on a click **or** on the cursor resting on it ~0.9 s, with a progress ring. Prefer it over a raw click listener for any "choose this" target. |
| `ctx.settings` | Per-game persistent settings: `get(key, fallback)` / `set(key, value)`. JSON-safe values only. |
| `ctx.exit()` | Return to the home screen. |

For a round-based quiz game (prompt → choices → cheer → next round), build on
`core/round.js` (`quizShell` + `pickOneRound`) instead of hand-rolling the
frame — it manages the tap-to-start gate, the 🔊/▶ buttons, and round timers
that must not outlive the game. `src/games/animals/game.js` is the reference.

### Game rules of thumb (this is for a 3-year-old)

- **Big hit targets**, obvious hover and pressed states. Forgiveness over precision.
- **Never punish.** Wrong answers get a gentle wiggle/shake and a soft sound, never a
  scary buzzer or a "game over."
- **No copyrighted assets.** Use emoji, inline SVG, CSS, and synthesized audio.
- **Clean up** in your returned cleanup function so the game can be reopened endlessly.
- Gate any **speech/audio** behind the first user tap (browsers block autoplay). The
  app unlocks audio on the first click globally; for speech-on-load, mirror the
  "Tap to start!" pattern in the animals game.
- Reuse the shared CSS helpers: `.big-prompt`, `.pop-in`, `.wiggle`, `.shake`, and the
  CSS variables `--primary --accent --surface --text --shadow --font --radius`.
- Scope your injected CSS under a root class (e.g. `.dino`) so games don't collide.

---

## Add a new theme

Even smaller — one file, one array entry.

### 1. Create `src/themes/<your-id>.js`

```js
// src/themes/ocean.js
export default {
  id: 'ocean',
  name: 'Ocean',
  emoji: '🌊',
  palette: {
    bg1: '#1565c0',     // background gradient start
    bg2: '#4dd0e1',     // background gradient end
    primary: '#ff7043', // main accent (buttons, highlights)
    accent: '#ffd54f',  // secondary accent
    surface: 'rgba(255,255,255,0.92)', // card background
    text: '#0d2b45',    // main text
    textMuted: '#3f6680',
  },
  background: {
    glyphs: ['🐠', '🐙', '🐚', '🌊', '🫧'], // emoji that drift across the home bg
    density: 18,        // how many floaters
    speed: 0.4,         // drift speed multiplier
  },
};
```

### 2. Register it in `src/themes/index.js`

```js
import ocean from './ocean.js';
// ...
export const THEMES = [rainbow, batRacers, bluePup, webHero, nightHeroes, ocean];
```

The theme appears as a chip on the home screen and is picked up by 🎲 Surprise.
Like games, theme files must also be added to `ASSETS` in `sw.js` with a
`CACHE` bump — CI enforces it.

> **Keep themes original.** They may be *inspired by* the colours/mood of a show, but
> must not reproduce its logos, characters, or artwork — the repo is public.

---

## Testing your changes

Serve locally (ES modules need http, not `file://`):

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

Run the same checks CI runs (plain node, no install):

```bash
node tools/smoke.mjs      # registries load, ids unique, palettes complete
node tools/check-sw.mjs   # sw.js ASSETS complete + CACHE bumped (checks commits)
```

Then click around: open the game, make sure sounds play, leave and re-open it (to
confirm your cleanup works), and try it under a couple of themes.
