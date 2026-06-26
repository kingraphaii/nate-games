/**
 * Peekaboo! — cause & effect for the very youngest.
 *
 * A grid of little curtained windows. Behind each curtain a friendly face is
 * hiding. Tap a closed window → the curtains part, the friend bounces in,
 * confetti pops, and the narrator cheers "Peekaboo! It's the Web Hero!".
 * Tap an open window → the curtains close again with a soft "bye bye".
 *
 * That appear/disappear loop IS peekaboo — endlessly repeatable, never any
 * losing. The 🔀 button hides everyone and shuffles in a fresh set of friends.
 *
 * Teaches: cause & effect, object permanence, names, and a first taste of the
 * mouse. Modeled on the Animal Friends / Match It reference games.
 *
 * Naming note: the "friends" are ORIGINAL, show-inspired nicknames (Web Hero,
 * Bat Hero, Pink Piggy…), matching this repo's themes — no third-party
 * characters, names, or art, so it's safe to host publicly. To make a friend
 * instantly recognizable for a particular child, edit the FRIENDS array below.
 */

// Each friend: a face (emoji), a spoken name, a little catchphrase, and a
// two-colour signature gradient that paints the window behind the curtains.
const FRIENDS = [
  { name: 'Web Hero',   emoji: '🕷️', say: 'Thwip, web away!',   bg: ['#e53935', '#1a2a6c'] },
  { name: 'Bat Hero',   emoji: '🦇', say: 'To the cave!',        bg: ['#37474f', '#ffca28'] },
  { name: 'Pink Piggy', emoji: '🐷', say: 'Oink oink!',          bg: ['#ff8fb1', '#ffd1e3'] },
  { name: 'Blue Pup',   emoji: '🐶', say: 'Woof, woof!',         bg: ['#2196f3', '#7ec8ff'] },
  { name: 'Star Mouse', emoji: '🐭', say: 'Ha ha!',              bg: ['#e53935', '#222831'] },
  { name: 'Princess',   emoji: '👸', say: 'Hooray!',             bg: ['#9b5de5', '#7ec8ff'] },
  { name: 'Dino',       emoji: '🦖', say: 'Roar!',               bg: ['#3fc25b', '#1b5e20'] },
  { name: 'Unicorn',    emoji: '🦄', say: 'Sparkle sparkle!',    bg: ['#f783ac', '#b197fc'] },
  { name: 'Robot',      emoji: '🤖', say: 'Beep boop!',          bg: ['#41ead4', '#2b6777'] },
  { name: 'Super Hero', emoji: '🦸', say: 'Up, up, away!',       bg: ['#ffd43b', '#ff922b'] },
  { name: 'Lion King',  emoji: '🦁', say: 'Roar!',               bg: ['#ffba08', '#bb6b00'] },
  { name: 'Froggy',     emoji: '🐸', say: 'Ribbit!',             bg: ['#74c69d', '#1b4332'] },
];

const DOOR_COUNT = 6; // 2×3 / 3×2 — a comfortable number of big targets.

export default {
  id: 'peekaboo',
  title: 'Peekaboo!',
  emoji: '🙈',
  blurb: 'Open the curtains — who is hiding?',
  tags: ['cause-effect', 'words', 'youngest'],

  mount(root, ctx) {
    let timers = [];

    root.innerHTML = `
      <div class="pk">
        <p class="big-prompt" id="pk-prompt">Tap a curtain… who's hiding? 👀</p>
        <button class="pk-shuffle" id="pk-shuffle" title="New friends">🔀 New friends</button>
        <div class="pk-grid" id="pk-grid"></div>
      </div>`;

    injectStyles();
    const promptEl = root.querySelector('#pk-prompt');
    const gridEl = root.querySelector('#pk-grid');
    const shuffleEl = root.querySelector('#pk-shuffle');

    // Build (or rebuild) the grid with a fresh random cast of friends.
    function deal() {
      const cast = ctx.shuffle(FRIENDS).slice(0, DOOR_COUNT);
      gridEl.innerHTML = '';
      for (const friend of cast) {
        gridEl.appendChild(makeDoor(friend));
      }
    }

    function makeDoor(friend) {
      const door = document.createElement('button');
      door.className = 'pk-door';
      door.setAttribute('aria-label', `A hidden friend. Tap to reveal.`);
      door.innerHTML = `
        <div class="pk-stage" style="background:linear-gradient(160deg, ${friend.bg[0]}, ${friend.bg[1]})">
          <span class="pk-emoji">${friend.emoji}</span>
        </div>
        <div class="pk-curtain pk-curtain--l"><span class="pk-eyes">👀</span></div>
        <div class="pk-curtain pk-curtain--r"><span class="pk-spark">✨</span></div>`;
      door.addEventListener('click', () => toggle(door, friend));
      return door;
    }

    function toggle(door, friend) {
      const opening = !door.classList.contains('is-open');
      if (opening) open(door, friend);
      else close(door);
    }

    function open(door, friend) {
      door.classList.add('is-open');
      door.setAttribute('aria-label', `${friend.name}. Tap to hide.`);
      ctx.audio.cheer();
      ctx.speak(`Peekaboo! It's the ${friend.name}! ${friend.say}`);
      promptEl.textContent = `Peekaboo! It's the ${friend.name}! ${friend.emoji}`;
      // Confetti from the centre of this window.
      const r = door.getBoundingClientRect();
      ctx.confetti(r.left + r.width / 2, r.top + r.height / 2);

      // Everyone's out? Cheer, then shuffle in a fresh set to start over.
      if (gridEl.querySelectorAll('.pk-door.is-open').length === DOOR_COUNT) {
        promptEl.textContent = `Hooray! Everyone's here! 🎉`;
        timers.push(setTimeout(() => {
          ctx.audio.cheer();
          ctx.speak('Yay! Here come new friends!');
          promptEl.textContent = `New friends! Who's hiding now? 👀`;
          deal();
        }, 1800));
      }
    }

    function close(door) {
      door.classList.remove('is-open');
      door.setAttribute('aria-label', `A hidden friend. Tap to reveal.`);
      ctx.audio.pop({ pitch: 0.8 });
      ctx.speak('Bye bye!', { pitch: 1.4 });
    }

    shuffleEl.addEventListener('click', () => {
      ctx.audio.swoosh?.();
      ctx.audio.pop({ pitch: 1.2 });
      promptEl.textContent = `New friends! Who's hiding now? 👀`;
      deal();
    });

    deal();

    // Cleanup: clear any pending timers (kept for parity with sibling games).
    return () => { timers.forEach(clearTimeout); timers = []; };
  },
};

function injectStyles() {
  if (document.getElementById('peekaboo-styles')) return;
  const css = document.createElement('style');
  css.id = 'peekaboo-styles';
  css.textContent = `
    .pk { height:100%; display:flex; flex-direction:column; align-items:center;
      justify-content:safe center; gap:14px; padding:16px; overflow-y:auto; }
    .pk-shuffle { padding:10px 20px; border:none; border-radius:999px; background:var(--accent);
      font-family:var(--font); font-size:1.1rem; font-weight:800; cursor:pointer; box-shadow:var(--shadow); }
    .pk-shuffle:hover { transform:scale(1.05); } .pk-shuffle:active { transform:scale(0.95); }

    /* 3 cols of square cells → grid height ≈ ²⁄₃ width. Cap width by height too
       (~108vh) so two rows clear short / landscape screens without clipping. */
    .pk-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:18px;
      width:min(92vw, 760px, 108vh); }
    @media (max-width: 520px) { .pk-grid { grid-template-columns:repeat(2, 1fr); } }

    /* Each window: a stage behind, two curtains in front. */
    .pk-door { position:relative; aspect-ratio:1/1; border:none; border-radius:26px;
      overflow:hidden; cursor:pointer; box-shadow:var(--shadow); background:#fff;
      padding:0; -webkit-tap-highlight-color:transparent; }
    .pk-door:hover { transform:translateY(-4px) scale(1.03); }
    .pk-door:active { transform:scale(0.97); }
    .pk-door, .pk-door:hover, .pk-door:active { transition:transform .12s ease; }

    .pk-stage { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
    .pk-emoji { font-size:clamp(48px, 12vw, 92px); transform:scale(0); transition:transform .35s cubic-bezier(.34,1.56,.64,1); }
    .pk-door.is-open .pk-emoji { transform:scale(1); animation:pk-bounce 1.4s ease-in-out .35s infinite; }

    /* Curtains — soft striped fabric in the theme primary colour. */
    .pk-curtain { position:absolute; top:0; bottom:0; width:50%;
      display:flex; align-items:center; justify-content:center;
      background:
        repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0 8px, rgba(255,255,255,0.10) 8px 16px),
        var(--primary);
      transition:transform .45s cubic-bezier(.7,0,.3,1); }
    .pk-curtain--l { left:0;  border-right:2px solid rgba(0,0,0,0.12); }
    .pk-curtain--r { right:0; border-left:2px solid rgba(0,0,0,0.12); }
    .pk-door.is-open .pk-curtain--l { transform:translateX(-100%); }
    .pk-door.is-open .pk-curtain--r { transform:translateX(100%); }

    .pk-eyes, .pk-spark { font-size:clamp(26px, 6vw, 40px); }
    /* Gentle "someone's in here!" wiggle while closed; calms on hover. */
    .pk-door:not(.is-open) .pk-eyes { animation:pk-peek 2.4s ease-in-out infinite; }
    .pk-door:hover .pk-eyes { animation-play-state:paused; }

    @keyframes pk-bounce { 0%,100% { transform:scale(1) translateY(0); } 50% { transform:scale(1.06) translateY(-6px); } }
    @keyframes pk-peek   { 0%,90%,100% { transform:translateY(0) rotate(0); } 45% { transform:translateY(-3px) rotate(-6deg); } }

    @media (prefers-reduced-motion: reduce) {
      .pk-emoji, .pk-eyes, .pk-curtain { transition:none !important; animation:none !important; }
      .pk-door.is-open .pk-emoji { transform:scale(1); }
    }
  `;
  document.head.appendChild(css);
}
