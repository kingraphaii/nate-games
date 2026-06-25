/**
 * game-api.js — The contract every game implements.
 *
 * A game is a plain object (or a module's default export) with this shape:
 *
 *   export default {
 *     id:    'animals',                 // unique, url-safe slug (matches folder name)
 *     title: 'Animal Friends',          // shown on the home card
 *     emoji: '🐮',                       // big icon on the home card
 *     blurb: 'Click an animal...',      // one-line description
 *     tags:  ['sounds', 'words'],       // optional, for future filtering
 *
 *     // Called when the game opens. `root` is an empty <div> that fills the
 *     // play area. `ctx` is a GameContext (see below). Build your UI inside
 *     // `root`. Optionally return a cleanup function (same as defining unmount).
 *     mount(root, ctx) { ... },
 *
 *     // Optional. Called when the player leaves. Stop timers, audio, RAF loops,
 *     // and remove global listeners here. (If mount() returned a function, that
 *     // runs too.)
 *     unmount() { ... },
 *   }
 *
 * GameContext (`ctx`) passed to mount():
 *   ctx.audio   -> the shared Audio engine (see core/audio.js)
 *   ctx.speak(text, opts)   -> say a word/sentence out loud (child-friendly voice)
 *   ctx.theme   -> the active theme object (palette, name, glyphs)
 *   ctx.palette -> shortcut to ctx.theme.palette
 *   ctx.exit()  -> return to the home screen
 *   ctx.confetti(x, y, opts) -> burst celebratory particles at a screen point
 *   ctx.activatable(el, onActivate, opts) -> make an element fire on a click OR
 *       on the cursor resting on it ~0.9s (a "dwell"), with a progress ring that
 *       traces its outline. Toddler-friendly: no precise click needed. onActivate
 *       gets { via: 'click'|'dwell', x, y } (x/y are viewport coords for confetti).
 *       opts.dwellMs (default 900). Returns a disposer. Prefer this over a raw
 *       click listener for any "choose this" target. See core/activatable.js.
 *   ctx.shuffle(array)       -> returns a new shuffled copy (handy helper)
 *   ctx.pick(array)          -> returns a random element
 *
 * Keep games:
 *   - Mouse-friendly: large hit targets, obvious hover/active states.
 *   - Self-contained: no network calls, no copyrighted assets.
 *   - Tidy: clean up everything in unmount so games can be reopened.
 */

/** Fisher–Yates shuffle returning a new array. */
export function shuffle(array) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Random element from an array. */
export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** Clamp a number to a range. */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** Validate a game object at registration time; throws on misconfiguration. */
export function assertValidGame(game) {
  const required = ['id', 'title', 'emoji', 'mount'];
  for (const key of required) {
    if (!(key in game)) {
      throw new Error(`Game is missing required field "${key}": ${JSON.stringify(game)}`);
    }
  }
  if (typeof game.mount !== 'function') {
    throw new Error(`Game "${game.id}" mount must be a function`);
  }
  return game;
}
