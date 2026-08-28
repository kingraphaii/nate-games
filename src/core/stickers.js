/**
 * stickers.js — Sticker rewards across every game.
 *
 * Games call ctx.award() at their milestone moments (a quiz win, every 10th
 * pop, a finished trace, ...). Every 3rd award in a game unlocks that game's
 * next sticker and shows a full-screen unlock overlay: the sticker pops in
 * huge with confetti, a cheer, and its spoken name, then dismisses itself.
 * A complete set earns a spoken mini-cheer instead — never nothing.
 *
 * The pacing (every 3rd) lives here, in one place; games only say "a milestone
 * happened". State persists through core/store.js (best-effort: in a private
 * window stickers simply do not survive a reload). Nothing expires and nothing
 * can be lost by playing — this is a collection, not a score.
 *
 * The 📖 Sticker Book (src/games/stickers/game.js) renders the catalog.
 */
import { load, save } from './store.js';

const KEY = 'stickers';
const EVERY = 3; // awards per unlock

/**
 * One sticker set per game id. `title`/`emoji` label the book shelf; `set` is
 * the spoken set name ("all the animal stickers"). Emoji art only — original,
 * license-free, and instantly readable for little eyes.
 */
export const CATALOG = {
  animals: {
    title: 'Animal Friends', emoji: '🐮', set: 'animal',
    items: [
      { id: 'animals:giraffe', emoji: '🦒', name: 'Giraffe' },
      { id: 'animals:zebra', emoji: '🦓', name: 'Zebra' },
      { id: 'animals:kangaroo', emoji: '🦘', name: 'Kangaroo' },
      { id: 'animals:sloth', emoji: '🦥', name: 'Sloth' },
      { id: 'animals:hedgehog', emoji: '🦔', name: 'Hedgehog' },
      { id: 'animals:parrot', emoji: '🦜', name: 'Parrot' },
      { id: 'animals:turtle', emoji: '🐢', name: 'Turtle' },
      { id: 'animals:butterfly', emoji: '🦋', name: 'Butterfly' },
    ],
  },
  peekaboo: {
    title: 'Peekaboo!', emoji: '🙈', set: 'peekaboo',
    items: [
      { id: 'peekaboo:teddy', emoji: '🧸', name: 'Teddy Bear' },
      { id: 'peekaboo:unicorn', emoji: '🦄', name: 'Unicorn' },
      { id: 'peekaboo:robot', emoji: '🤖', name: 'Robot' },
      { id: 'peekaboo:fairy', emoji: '🧚', name: 'Fairy' },
      { id: 'peekaboo:chick', emoji: '🐣', name: 'Baby Chick' },
      { id: 'peekaboo:carousel', emoji: '🎠', name: 'Carousel Pony' },
      { id: 'peekaboo:doll', emoji: '🪆', name: 'Little Doll' },
      { id: 'peekaboo:circus', emoji: '🎪', name: 'Big Top' },
    ],
  },
  bubbles: {
    title: 'Bubble Pop', emoji: '🫧', set: 'ocean',
    items: [
      { id: 'bubbles:dolphin', emoji: '🐬', name: 'Dolphin' },
      { id: 'bubbles:whale', emoji: '🐳', name: 'Whale' },
      { id: 'bubbles:octopus', emoji: '🐙', name: 'Octopus' },
      { id: 'bubbles:crab', emoji: '🦀', name: 'Crab' },
      { id: 'bubbles:fish', emoji: '🐠', name: 'Rainbow Fish' },
      { id: 'bubbles:shell', emoji: '🐚', name: 'Seashell' },
      { id: 'bubbles:squid', emoji: '🦑', name: 'Squid' },
      { id: 'bubbles:coral', emoji: '🪸', name: 'Coral' },
    ],
  },
  balloons: {
    title: 'Balloon Bash', emoji: '🎈', set: 'party',
    items: [
      { id: 'balloons:popper', emoji: '🎉', name: 'Party Popper' },
      { id: 'balloons:cake', emoji: '🎂', name: 'Birthday Cake' },
      { id: 'balloons:cupcake', emoji: '🧁', name: 'Cupcake' },
      { id: 'balloons:gift', emoji: '🎁', name: 'Present' },
      { id: 'balloons:pinata', emoji: '🪅', name: 'Piñata' },
      { id: 'balloons:bow', emoji: '🎀', name: 'Bow' },
      { id: 'balloons:confetti', emoji: '🎊', name: 'Confetti Ball' },
      { id: 'balloons:party', emoji: '🥳', name: 'Party Face' },
    ],
  },
  fruit: {
    title: 'Fruit Slice', emoji: '🍉', set: 'fruit',
    items: [
      { id: 'fruit:strawberry', emoji: '🍓', name: 'Strawberry' },
      { id: 'fruit:pineapple', emoji: '🍍', name: 'Pineapple' },
      { id: 'fruit:mango', emoji: '🥭', name: 'Mango' },
      { id: 'fruit:cherries', emoji: '🍒', name: 'Cherries' },
      { id: 'fruit:peach', emoji: '🍑', name: 'Peach' },
      { id: 'fruit:kiwi', emoji: '🥝', name: 'Kiwi' },
      { id: 'fruit:grapes', emoji: '🍇', name: 'Grapes' },
      { id: 'fruit:lemon', emoji: '🍋', name: 'Lemon' },
    ],
  },
  trace: {
    title: 'Trace Trails', emoji: '✏️', set: 'vehicle',
    items: [
      { id: 'trace:car', emoji: '🚗', name: 'Race Car' },
      { id: 'trace:bus', emoji: '🚌', name: 'Bus' },
      { id: 'trace:train', emoji: '🚂', name: 'Train' },
      { id: 'trace:helicopter', emoji: '🚁', name: 'Helicopter' },
      { id: 'trace:rocket', emoji: '🚀', name: 'Rocket' },
      { id: 'trace:boat', emoji: '⛵', name: 'Sailboat' },
      { id: 'trace:tractor', emoji: '🚜', name: 'Tractor' },
      { id: 'trace:firetruck', emoji: '🚒', name: 'Fire Truck' },
    ],
  },
  match: {
    title: 'Match It', emoji: '🔶', set: 'rainbow',
    items: [
      { id: 'match:rainbow', emoji: '🌈', name: 'Rainbow' },
      { id: 'match:gem', emoji: '💎', name: 'Gem' },
      { id: 'match:kite', emoji: '🪁', name: 'Kite' },
      { id: 'match:paints', emoji: '🎨', name: 'Paint Set' },
      { id: 'match:puzzle', emoji: '🧩', name: 'Puzzle Piece' },
      { id: 'match:disco', emoji: '🪩', name: 'Disco Ball' },
      { id: 'match:target', emoji: '🎯', name: 'Bullseye' },
      { id: 'match:rosette', emoji: '🏵️', name: 'Rosette' },
    ],
  },
  numbers: {
    title: 'Count With Me', emoji: '🔢', set: 'counting',
    items: [
      { id: 'numbers:dice', emoji: '🎲', name: 'Dice' },
      { id: 'numbers:abacus', emoji: '🧮', name: 'Abacus' },
      { id: 'numbers:clock', emoji: '⏰', name: 'Clock' },
      { id: 'numbers:hand', emoji: '🖐️', name: 'High Five' },
      { id: 'numbers:medal', emoji: '🥇', name: 'Gold Medal' },
      { id: 'numbers:trophy', emoji: '🏆', name: 'Trophy' },
      { id: 'numbers:ten', emoji: '🔟', name: 'Perfect Ten' },
      { id: 'numbers:coin', emoji: '🪙', name: 'Lucky Coin' },
    ],
  },
  letters: {
    title: 'Letter Sounds', emoji: '🔤', set: 'writing',
    items: [
      { id: 'letters:pencil', emoji: '✏️', name: 'Pencil' },
      { id: 'letters:crayon', emoji: '🖍️', name: 'Crayon' },
      { id: 'letters:books', emoji: '📚', name: 'Book Stack' },
      { id: 'letters:notepad', emoji: '📝', name: 'Notepad' },
      { id: 'letters:letter', emoji: '✉️', name: 'Letter' },
      { id: 'letters:scroll', emoji: '📜', name: 'Scroll' },
      { id: 'letters:pen', emoji: '🖊️', name: 'Pen' },
      { id: 'letters:redbook', emoji: '📕', name: 'Red Book' },
    ],
  },
  music: {
    title: 'Music Party', emoji: '🎶', set: 'music',
    items: [
      { id: 'music:drum', emoji: '🥁', name: 'Drum' },
      { id: 'music:guitar', emoji: '🎸', name: 'Guitar' },
      { id: 'music:trumpet', emoji: '🎺', name: 'Trumpet' },
      { id: 'music:violin', emoji: '🎻', name: 'Violin' },
      { id: 'music:piano', emoji: '🎹', name: 'Piano' },
      { id: 'music:microphone', emoji: '🎤', name: 'Microphone' },
      { id: 'music:maracas', emoji: '🪇', name: 'Maracas' },
      { id: 'music:saxophone', emoji: '🎷', name: 'Saxophone' },
    ],
  },
};

// Wired by the app shell at boot. Injected (not imported) so this module — and
// the registry import chain through the Sticker Book — stays loadable in node
// for the CI smoke test (audio.js touches `window` at import time).
let deps = { confetti: null, audio: null };

/** Called once by the app shell so unlocks can cheer, speak, and burst confetti. */
export function initStickers(d) {
  deps = { ...deps, ...d };
}

/** Read the current sticker state: { counts: {gameId: n}, earned: [ids] }. */
export function stickerState() {
  return load(KEY, { counts: {}, earned: [] });
}

/**
 * Register one milestone for a game. Unknown game ids (e.g. the Sticker Book
 * itself) are ignored. Every EVERY-th milestone unlocks the next sticker.
 */
export function awardSticker(gameId) {
  const set = CATALOG[gameId];
  if (!set) return;

  const state = stickerState();
  state.counts[gameId] = (state.counts[gameId] || 0) + 1;

  if (state.counts[gameId] % EVERY !== 0) {
    save(KEY, state);
    return;
  }

  const next = set.items.find((item) => !state.earned.includes(item.id));
  if (next) {
    state.earned.push(next.id);
    save(KEY, state);
    showUnlock(next);
  } else {
    // The set is complete — still a happy moment, never nothing.
    save(KEY, state);
    deps.audio?.cheer();
    deps.audio?.speak(`Wow! You have all the ${set.set} stickers!`);
  }
}

/** Full-screen unlock celebration. Taps pass through; it dismisses itself. */
function showUnlock(sticker) {
  injectStyles();
  document.querySelector('.sticker-unlock')?.remove(); // one at a time

  const overlay = document.createElement('div');
  overlay.className = 'sticker-unlock';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="sticker-unlock-card">
      <span class="sticker-unlock-emoji">${sticker.emoji}</span>
      <p class="sticker-unlock-title">You got a sticker!</p>
      <p class="sticker-unlock-name">${sticker.name}</p>
    </div>`;
  document.body.appendChild(overlay);

  deps.audio?.cheer();
  deps.audio?.speak(`You got a sticker! The ${sticker.name}!`);
  deps.confetti?.(window.innerWidth / 2, window.innerHeight / 2, { count: 60 });

  setTimeout(() => overlay.classList.add('is-leaving'), 2200);
  setTimeout(() => overlay.remove(), 2600);
}

function injectStyles() {
  if (document.getElementById('sticker-styles')) return;
  const css = document.createElement('style');
  css.id = 'sticker-styles';
  css.textContent = `
    .sticker-unlock { position:fixed; inset:0; z-index:60; display:flex; align-items:center;
      justify-content:center; background:rgba(0,0,0,0.28); pointer-events:none;
      animation:stickerFade .25s ease; }
    .sticker-unlock.is-leaving { opacity:0; transition:opacity .4s ease; }
    .sticker-unlock-card { display:flex; flex-direction:column; align-items:center; gap:6px;
      padding:28px 44px; border-radius:36px; background:var(--surface, #fff);
      box-shadow:0 18px 50px rgba(0,0,0,0.35); animation:stickerPop .5s cubic-bezier(0.18,0.89,0.32,1.28); }
    .sticker-unlock-emoji { font-size:clamp(5rem,18vw,8.5rem); line-height:1;
      filter:drop-shadow(0 8px 14px rgba(0,0,0,0.25)); }
    .sticker-unlock-title { margin:0; font-family:var(--font); font-weight:800;
      font-size:clamp(1.3rem,4vw,1.9rem); color:var(--text, #333); }
    .sticker-unlock-name { margin:0; font-family:var(--font); font-weight:800;
      font-size:clamp(1.1rem,3.4vw,1.5rem); color:var(--primary, #4dabf7); }
    @keyframes stickerFade { from { opacity:0; } }
    @keyframes stickerPop { 0% { transform:scale(0.3); } 60% { transform:scale(1.12); }
      100% { transform:scale(1); } }
    @media (prefers-reduced-motion: reduce) {
      .sticker-unlock, .sticker-unlock-card { animation:none; }
    }
  `;
  document.head.appendChild(css);
}
