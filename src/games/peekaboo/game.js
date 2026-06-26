/**
 * Peekaboo! — cause & effect for the very youngest.
 *
 * A grid of little curtained windows. Behind each curtain a friendly face is
 * hiding. Tap a closed window → the curtains part, the friend bounces in with
 * their OWN signature sound, voice and wiggle, confetti pops in their colours,
 * and the narrator cheers "Peekaboo! It's the Dino! Roar!". Tap an open window
 * → the curtains close again with a soft "bye bye".
 *
 * That appear/disappear loop IS peekaboo — endlessly repeatable, never any
 * losing. Open all six → a little party (a cascade of confetti + a finale
 * jingle), then a fresh cast deals itself in. The 🔀 button reshuffles anytime.
 *
 * Teaches: cause & effect, object permanence, names, animal sounds, and a first
 * taste of the mouse.
 *
 * Each friend carries a little personality so repeats stay fresh:
 *   name    — spoken name
 *   emoji   — the face (a single, widely-supported emoji)
 *   say     — a POOL of catchphrases; one is picked at random each reveal
 *   sound   — a key into SOUNDS below: their synthesized signature sound
 *   voice   — { pitch, rate } tuning for the narrator on this friend
 *   bounce  — entrance/idle wiggle style: bounce|float|chug|wobble|pulse
 *   bg      — two-colour gradient (also used for that friend's confetti)
 *
 * Naming note: the "friends" are ORIGINAL, show-inspired nicknames — no
 * third-party characters, names, or art, so it's safe to host publicly. To make
 * a friend instantly recognizable for a particular child, edit FRIENDS below.
 */

import { floatText, pulse, injectJuiceStyles } from '../../core/juice.js';

/**
 * Signature sounds, built only from the shared synth primitives (no audio
 * files). Each is a function of the audio engine so the data stays declarative.
 */
const SOUNDS = {
  cheer:   (a) => a.cheer(),
  sparkle: (a) => a.melody([['C6', 0.09], ['E6', 0.09], ['G6', 0.13]], { type: 'triangle', volume: 0.4 }),
  heroic:  (a) => a.melody([['G4', 0.12], ['C5', 0.12], ['E5', 0.20]], { type: 'square', volume: 0.4 }),
  royal:   (a) => a.melody([['C5', 0.12], ['E5', 0.12], ['G5', 0.12], ['C6', 0.20]], { type: 'triangle', volume: 0.4 }),
  growl:   (a) => a.tone(90,  { duration: 0.34, type: 'sawtooth', volume: 0.4, glide: 0.5 }),
  squeak:  (a) => a.tone(880, { duration: 0.12, type: 'square', volume: 0.3, glide: 2.0 }),
  ribbit:  (a) => a.tone(170, { duration: 0.16, type: 'sawtooth', volume: 0.4, glide: 1.7 }),
  beep:    (a) => a.melody([['E5', 0.08], ['B5', 0.10]], { type: 'square', volume: 0.35 }),
  trumpet: (a) => a.tone(160, { duration: 0.42, type: 'sawtooth', volume: 0.4, glide: 1.6 }),
  pop2:    (a) => a.pop({ pitch: 1.3 }),
  buzz:    (a) => a.tone(210, { duration: 0.30, type: 'sawtooth', volume: 0.28, glide: 1.06 }),
  moo:     (a) => a.tone(150, { duration: 0.42, type: 'sine', volume: 0.45, glide: 0.7 }),
  chirp:   (a) => a.melody([['E6', 0.07], ['G6', 0.07], ['E6', 0.07]], { type: 'sine', volume: 0.35 }),
  baa:     (a) => a.tone(330, { duration: 0.30, type: 'triangle', volume: 0.4, glide: 0.85 }),
  honk:    (a) => a.tone(300, { duration: 0.18, type: 'square', volume: 0.4 }),
  woof:    (a) => { a.tone(280, { duration: 0.1, type: 'square', volume: 0.4, glide: 0.7 });
                   a.tone(240, { duration: 0.1, type: 'square', volume: 0.4, glide: 0.7, when: 0.13 }); },
  splash:  (a) => a.swoosh({ pitch: 0.8 }),
  zoom:    (a) => a.tone(180, { duration: 0.40, type: 'sawtooth', volume: 0.32, glide: 5 }),
  siren:   (a) => a.melody([['A4', 0.18], ['E4', 0.18], ['A4', 0.18]], { type: 'sine', volume: 0.4 }),
  chug:    (a) => a.melody([['C3', 0.10], ['C3', 0.10], ['G3', 0.14]], { type: 'sine', volume: 0.5 }),
  turtle:  (a) => a.tone(140, { duration: 0.50, type: 'sine', volume: 0.35, glide: 1.1 }),
};

// A few short surprise phrases the narrator leads with, so the same friend
// doesn't always say the exact same opener.
const REVEAL_PHRASES = ['Peekaboo!', 'Boo!', 'Hello!', 'Surprise!', 'Look who!', 'Peek-a-boo!'];

const FRIENDS = [
  // ── The original hero/pet crew ───────────────────────────────────────────
  { name: 'Web Hero',   emoji: '🕷️', say: ['Thwip!', 'Web away!', 'Up high!'],          sound: 'heroic',  voice: { pitch: 1.0 }, bounce: 'bounce', bg: ['#e53935', '#1a2a6c'] },
  { name: 'Bat Hero',   emoji: '🦇', say: ['To the cave!', 'Swoosh!', 'Night flight!'],  sound: 'heroic',  voice: { pitch: 0.8 }, bounce: 'float',  bg: ['#37474f', '#ffca28'] },
  { name: 'Pink Piggy', emoji: '🐷', say: ['Oink oink!', 'Wee wee!', 'Snuffle!'],        sound: 'squeak',  voice: { pitch: 1.4 }, bounce: 'bounce', bg: ['#ff8fb1', '#ffd1e3'] },
  { name: 'Blue Pup',   emoji: '🐶', say: ['Woof woof!', 'Bark bark!', 'Wuff!'],         sound: 'woof',    voice: { pitch: 1.3 }, bounce: 'bounce', bg: ['#2196f3', '#7ec8ff'] },
  { name: 'Star Mouse', emoji: '🐭', say: ['Squeak!', 'Ha ha!', 'Cheese please!'],       sound: 'squeak',  voice: { pitch: 1.6 }, bounce: 'bounce', bg: ['#e53935', '#222831'] },
  { name: 'Princess',   emoji: '👸', say: ['Hooray!', 'Twirl!', 'La la la!'],            sound: 'royal',   voice: { pitch: 1.5 }, bounce: 'float',  bg: ['#9b5de5', '#7ec8ff'] },
  { name: 'Dino',       emoji: '🦖', say: ['Roar!', 'Stomp stomp!', 'Rawr!'],            sound: 'growl',   voice: { pitch: 0.7 }, bounce: 'bounce', bg: ['#3fc25b', '#1b5e20'] },
  { name: 'Unicorn',    emoji: '🦄', say: ['Sparkle!', 'Magic!', 'Neigh!'],              sound: 'sparkle', voice: { pitch: 1.5 }, bounce: 'float',  bg: ['#f783ac', '#b197fc'] },
  { name: 'Robot',      emoji: '🤖', say: ['Beep boop!', 'Whirr!', 'Bleep bloop!'],      sound: 'beep',    voice: { pitch: 1.0, rate: 1.05 }, bounce: 'chug', bg: ['#41ead4', '#2b6777'] },
  { name: 'Super Hero', emoji: '🦸', say: ['Up, up, away!', 'Zoom!', 'To the sky!'],     sound: 'heroic',  voice: { pitch: 1.1 }, bounce: 'float',  bg: ['#ffd43b', '#ff922b'] },
  { name: 'Lion King',  emoji: '🦁', say: ['Roar!', 'Grrr!', 'Big roar!'],              sound: 'growl',   voice: { pitch: 0.8 }, bounce: 'bounce', bg: ['#ffba08', '#bb6b00'] },
  { name: 'Froggy',     emoji: '🐸', say: ['Ribbit!', 'Hop hop!', 'Croak!'],            sound: 'ribbit',  voice: { pitch: 1.2 }, bounce: 'pulse',  bg: ['#74c69d', '#1b4332'] },

  // ── Wild animals ─────────────────────────────────────────────────────────
  { name: 'Big Ellie',    emoji: '🐘', say: ['Toot toot!', 'Stomp!', 'Splash!'],            sound: 'trumpet', voice: { pitch: 0.7 }, bounce: 'bounce', bg: ['#b0aab0', '#6d7b8d'] },
  { name: 'Tall Giraffe', emoji: '🦒', say: ['Munch munch!', 'Way up high!', 'Hello down there!'], sound: 'sparkle', voice: { pitch: 1.0 }, bounce: 'float', bg: ['#ffb347', '#a0522d'] },
  { name: 'Panda Munch',  emoji: '🐼', say: ['Nom nom!', 'Crunch!', 'Bamboo!'],             sound: 'pop2',    voice: { pitch: 1.2 }, bounce: 'bounce', bg: ['#2c2c2c', '#f5f0e8'] },
  { name: 'Foxy',         emoji: '🦊', say: ['Yip yip!', 'Sneaky!', 'Hee hee!'],            sound: 'squeak',  voice: { pitch: 1.3 }, bounce: 'bounce', bg: ['#e8651a', '#ffd166'] },
  { name: 'Flutter',      emoji: '🦋', say: ['Flutter by!', 'Fly fly!', 'So pretty!'],      sound: 'sparkle', voice: { pitch: 1.6 }, bounce: 'float',  bg: ['#9b59b6', '#f8c8d4'] },
  { name: 'Koala Hug',    emoji: '🐨', say: ['Cuddle!', 'Squeeze!', 'Sleepy!'],            sound: 'squeak',  voice: { pitch: 1.1 }, bounce: 'pulse',  bg: ['#7ba7bc', '#5c7a8a'] },
  { name: 'Buzzy Bee',    emoji: '🐝', say: ['Bzzz!', 'Buzz buzz!', 'Honey!'],             sound: 'buzz',    voice: { pitch: 1.5 }, bounce: 'float',  bg: ['#ffd000', '#3a2d00'] },

  // ── Farm friends ─────────────────────────────────────────────────────────
  { name: 'Moo Cow',     emoji: '🐮', say: ['Moo moo!', 'Mooooo!', 'Munch!'],             sound: 'moo',     voice: { pitch: 0.9 }, bounce: 'bounce', bg: ['#f5deb3', '#7b4f2a'] },
  { name: 'Clucky Hen',  emoji: '🐔', say: ['Cluck cluck!', 'Bawk!', 'Peck peck!'],        sound: 'chirp',   voice: { pitch: 1.4 }, bounce: 'chug',   bg: ['#ffd700', '#ff6b35'] },
  { name: 'Woolly Lamb', emoji: '🐑', say: ['Baa baa!', 'Soft wool!', 'Maa!'],            sound: 'baa',     voice: { pitch: 1.2 }, bounce: 'bounce', bg: ['#e8e8f0', '#87ceeb'] },
  { name: 'Polly',       emoji: '🦜', say: ['Hello hello!', 'Squawk!', 'Pretty bird!'],    sound: 'chirp',   voice: { pitch: 1.5 }, bounce: 'float',  bg: ['#ff4500', '#28b463'] },
  { name: 'Waddle Pete', emoji: '🐧', say: ['Waddle waddle!', 'Slide!', 'Brr!'],          sound: 'honk',    voice: { pitch: 1.2 }, bounce: 'chug',   bg: ['#1c2952', '#87ceeb'] },

  // ── Sea friends ──────────────────────────────────────────────────────────
  { name: 'Octo',        emoji: '🐙', say: ['Wiggle wiggle!', 'Eight arms!', 'Glub!'],     sound: 'splash',  voice: { pitch: 1.3 }, bounce: 'wobble', bg: ['#9b59b6', '#ff79a8'] },
  { name: 'Crabby',      emoji: '🦀', say: ['Snip snap!', 'Pinch!', 'Sideways!'],          sound: 'pop2',    voice: { pitch: 1.1 }, bounce: 'chug',   bg: ['#dc143c', '#ff8c00'] },
  { name: 'Flipper',     emoji: '🐬', say: ['Eee eee!', 'Splash!', 'Flip!'],              sound: 'sparkle', voice: { pitch: 1.6 }, bounce: 'wobble', bg: ['#1a6bb5', '#40e0d0'] },
  { name: 'Stripey',     emoji: '🐠', say: ['Blub blub!', 'Bubbles!', 'Swish!'],           sound: 'splash',  voice: { pitch: 1.4 }, bounce: 'wobble', bg: ['#ff6b35', '#ffd166'] },
  { name: 'Slow Turtle', emoji: '🐢', say: ['Slow and steady!', 'Hello!', 'Tuck in!'],     sound: 'turtle',  voice: { pitch: 0.9 }, bounce: 'pulse',  bg: ['#74c69d', '#2d6a4f'] },

  // ── Things that go ───────────────────────────────────────────────────────
  { name: 'Choo Train',  emoji: '🚂', say: ['Choo choo!', 'Chugga chugga!', 'All aboard!'], sound: 'chug',   voice: { pitch: 1.0 }, bounce: 'chug',   bg: ['#cc2200', '#ffd700'] },
  { name: 'Zoom Rocket', emoji: '🚀', say: ['Blast off!', 'Zoom!', 'To the stars!'],       sound: 'zoom',    voice: { pitch: 1.0 }, bounce: 'float',  bg: ['#1a1a3e', '#ff6b35'] },
  { name: 'Fire Truck',  emoji: '🚒', say: ['Wee woo!', 'Ding ding!', 'Here I come!'],      sound: 'siren',   voice: { pitch: 1.0 }, bounce: 'chug',   bg: ['#ff3300', '#ffaa00'] },
  { name: 'Whirly Bird', emoji: '🚁', say: ['Whirr whirr!', 'Up we go!', 'Spin spin!'],     sound: 'buzz',    voice: { pitch: 1.0 }, bounce: 'float',  bg: ['#2b5baa', '#b8d4f0'] },

  // ── Sky & treats ─────────────────────────────────────────────────────────
  { name: 'Rainbow',     emoji: '🌈', say: ['So pretty!', 'Colours!', 'Over the sky!'],     sound: 'sparkle', voice: { pitch: 1.4 }, bounce: 'float',  bg: ['#ff4560', '#7b2fbe'] },
  { name: 'Sunny',       emoji: '🌞', say: ['Shine shine!', 'Good morning!', 'So warm!'],   sound: 'sparkle', voice: { pitch: 1.4 }, bounce: 'pulse',  bg: ['#ffd000', '#ff8c00'] },
  { name: 'Icy Swirl',   emoji: '🍦', say: ['Yummy yummy!', 'So sweet!', 'Lick lick!'],     sound: 'pop2',    voice: { pitch: 1.5 }, bounce: 'pulse',  bg: ['#ffb6c1', '#e8d5ff'] },
];

const DOOR_COUNT = 6; // 2×3 / 3×2 — a comfortable number of big targets.
const IDLE_MS = 5000; // after this long with no tap, a closed window "knocks".

export default {
  id: 'peekaboo',
  title: 'Peekaboo!',
  emoji: '🙈',
  blurb: 'Open the curtains — who is hiding?',
  tags: ['cause-effect', 'words', 'youngest'],

  mount(root, ctx) {
    let timers = [];
    let idleTimer = null;

    root.innerHTML = `
      <div class="pk">
        <p class="big-prompt" id="pk-prompt">Tap a curtain… who's hiding? 👀</p>
        <button class="pk-shuffle" id="pk-shuffle" title="New friends">🔀 New friends</button>
        <div class="pk-grid" id="pk-grid"></div>
      </div>`;

    injectStyles();
    injectJuiceStyles(); // floatText needs the shared juice styles
    const promptEl = root.querySelector('#pk-prompt');
    const gridEl = root.querySelector('#pk-grid');
    const shuffleEl = root.querySelector('#pk-shuffle');

    // ── Idle "knock knock" — re-invite a wandering toddler without nagging.
    // No speech (speechSynthesis would cancel an in-progress reveal), just a
    // soft two-knock and a little door shudder. One timer, reset on any tap.
    function scheduleIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(idleKnock, IDLE_MS);
    }
    function idleKnock() {
      const closed = [...gridEl.querySelectorAll('.pk-door:not(.is-open)')];
      if (closed.length) {
        const door = ctx.pick(closed);
        door.classList.add('pk-knocking');
        ctx.audio.pop({ pitch: 0.6 });
        timers.push(setTimeout(() => ctx.audio.pop({ pitch: 0.6 }), 200));
        timers.push(setTimeout(() => door.classList.remove('pk-knocking'), 700));
      }
      scheduleIdle();
    }

    // Build (or rebuild) the grid with a fresh random cast of friends.
    function deal() {
      const cast = ctx.shuffle(FRIENDS).slice(0, DOOR_COUNT);
      gridEl.innerHTML = '';
      cast.forEach((friend, i) => {
        const door = makeDoor(friend);
        // Cascade the cast in (suppressed under prefers-reduced-motion).
        door.style.animation = 'pk-deal .42s cubic-bezier(.34,1.56,.64,1) both';
        door.style.animationDelay = `${i * 65}ms`;
        gridEl.appendChild(door);
      });
      scheduleIdle();
    }

    function makeDoor(friend) {
      const door = document.createElement('button');
      door.className = 'pk-door';
      door.setAttribute('aria-label', `A hidden friend. Tap to reveal.`);
      door.innerHTML = `
        <div class="pk-stage" style="background:linear-gradient(160deg, ${friend.bg[0]}, ${friend.bg[1]})">
          <span class="pk-emoji pk-emoji--${friend.bounce || 'bounce'}">${friend.emoji}</span>
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

      // Signature sound, then ONE narration (chaining speak() would cancel it).
      (SOUNDS[friend.sound] || SOUNDS.cheer)(ctx.audio);
      const phrase = ctx.pick(REVEAL_PHRASES);
      const say = Array.isArray(friend.say) ? ctx.pick(friend.say) : friend.say;
      ctx.speak(`${phrase} It's the ${friend.name}! ${say}`, friend.voice || {});

      promptEl.textContent = `${phrase} It's the ${friend.name}! ${friend.emoji}`;
      pulse(promptEl, 'pk-stamp');

      // Confetti in this friend's own colours, from the window centre.
      const r = door.getBoundingClientRect();
      ctx.confetti(r.left + r.width / 2, r.top + r.height / 2, { colors: friend.bg });

      // The catchphrase floats up over the window — the friend "speaks" visually.
      const g = gridEl.getBoundingClientRect();
      floatText(gridEl, r.left + r.width / 2 - g.left, r.top + r.height * 0.32 - g.top, say,
        { color: '#fff', big: true });

      // Everyone's out? Throw a little party, then deal a fresh cast.
      if (gridEl.querySelectorAll('.pk-door.is-open').length === DOOR_COUNT) {
        party();
      } else {
        scheduleIdle();
      }
    }

    function close(door) {
      door.classList.remove('is-open');
      door.setAttribute('aria-label', `A hidden friend. Tap to reveal.`);
      ctx.audio.pop({ pitch: 0.8 });
      ctx.speak('Bye bye!', { pitch: 1.4 });
      scheduleIdle();
    }

    // All six open: cascade confetti across every window, a rising finale
    // jingle, a gentle grid shake, then a fresh cast.
    function party() {
      clearTimeout(idleTimer);
      promptEl.textContent = `Hooray! Everyone's here! 🎉`;
      pulse(promptEl, 'pk-stamp');
      pulse(gridEl, 'pk-party');
      ctx.audio.melody(
        [['C5', 0.10], ['E5', 0.10], ['G5', 0.10], ['C6', 0.12], ['E6', 0.16], ['G6', 0.26]],
        { type: 'triangle' });

      const doors = [...gridEl.querySelectorAll('.pk-door')];
      doors.forEach((d, i) => {
        timers.push(setTimeout(() => {
          const rr = d.getBoundingClientRect();
          ctx.confetti(rr.left + rr.width / 2, rr.top + rr.height / 2, { count: 22 });
        }, i * 70));
      });

      timers.push(setTimeout(() => {
        ctx.audio.cheer();
        ctx.speak('Yay! Here come new friends!');
        promptEl.textContent = `New friends! Who's hiding now? 👀`;
        deal();
      }, 1900));
    }

    shuffleEl.addEventListener('click', () => {
      ctx.audio.swoosh?.();
      ctx.audio.pop({ pitch: 1.2 });
      const rs = shuffleEl.getBoundingClientRect();
      ctx.confetti(rs.left + rs.width / 2, rs.top + rs.height / 2,
        { count: 16, colors: ['#ffd166', '#ff6b9d', '#41ead4'] });
      pulse(shuffleEl, 'pk-jiggle');
      promptEl.textContent = `New friends! Who's hiding now? 👀`;
      deal();
    });

    // Any pointer activity over the grid postpones the idle knock.
    gridEl.addEventListener('pointerdown', scheduleIdle);

    deal();

    // Cleanup: drop every pending timer (one-shots + the idle knock).
    return () => {
      timers.forEach(clearTimeout);
      timers = [];
      clearTimeout(idleTimer);
    };
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
    .pk-shuffle.pk-jiggle { animation:pk-jiggle .4s ease; }

    /* 3 cols of square cells → grid height ≈ ²⁄₃ width. Cap width by height too
       (~108vh) so two rows clear short / landscape screens without clipping.
       position:relative so floatText catchphrases anchor to the grid. */
    .pk-grid { position:relative; display:grid; grid-template-columns:repeat(3, 1fr); gap:18px;
      width:min(92vw, 760px, 108vh); }
    .pk-grid.pk-party { animation:pk-party .5s ease; }
    @media (max-width: 520px) { .pk-grid { grid-template-columns:repeat(2, 1fr); } }

    /* Each window: a stage behind, two curtains in front. */
    .pk-door { position:relative; aspect-ratio:1/1; border:none; border-radius:26px;
      overflow:hidden; cursor:pointer; box-shadow:var(--shadow); background:#fff;
      padding:0; -webkit-tap-highlight-color:transparent; }
    .pk-door:hover { transform:translateY(-4px) scale(1.03); }
    .pk-door:active { transform:scale(0.97); }
    .pk-door, .pk-door:hover, .pk-door:active { transition:transform .12s ease; }
    .pk-door.pk-knocking { animation:pk-knock .22s ease 2; }

    .pk-stage { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
    /* A camera-flash "ta-da" as the curtains part. */
    .pk-stage::after { content:''; position:absolute; inset:0; background:#fff; opacity:0; pointer-events:none; }
    .pk-door.is-open .pk-stage::after { animation:pk-flash .3s ease-out; }

    .pk-emoji { font-size:clamp(48px, 12vw, 92px); transform:scale(0);
      transition:transform .35s cubic-bezier(.34,1.56,.64,1); }
    .pk-door.is-open .pk-emoji { transform:scale(1); }
    /* Per-friend idle wiggle, starting after the entrance pop settles (.35s). */
    .pk-door.is-open .pk-emoji--bounce { animation:pk-bounce 1.4s ease-in-out .35s infinite; }
    .pk-door.is-open .pk-emoji--float  { animation:pk-float 2.4s ease-in-out .35s infinite; }
    .pk-door.is-open .pk-emoji--chug   { animation:pk-chug .9s steps(4,end) .35s infinite; }
    .pk-door.is-open .pk-emoji--wobble { animation:pk-wobble 1.6s ease-in-out .35s infinite; }
    .pk-door.is-open .pk-emoji--pulse  { animation:pk-pulse 1.2s ease-in-out .35s infinite; }

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

    /* Hover-peek (mouse only): the curtains crack and a sliver of the friend
       shows through the gap — curiosity before commitment. Touch-tap never
       triggers :hover here, so no mobile flicker. */
    @media (hover: hover) {
      .pk-door:not(.is-open):hover .pk-curtain--l { transform:translateX(-12%); }
      .pk-door:not(.is-open):hover .pk-curtain--r { transform:translateX(12%); }
      .pk-door:not(.is-open):hover .pk-emoji { transform:scale(.34); }
    }

    @keyframes pk-bounce { 0%,100% { transform:scale(1) translateY(0); } 50% { transform:scale(1.06) translateY(-6px); } }
    @keyframes pk-float  { 0%,100% { transform:scale(1) translateY(0) rotate(-3deg); } 50% { transform:scale(1.04) translateY(-10px) rotate(3deg); } }
    @keyframes pk-chug   { 0% { transform:scale(1) translateX(-5px); } 100% { transform:scale(1) translateX(5px); } }
    @keyframes pk-wobble { 0%,100% { transform:scale(1) rotate(-9deg); } 50% { transform:scale(1.05) rotate(9deg); } }
    @keyframes pk-pulse  { 0%,100% { transform:scale(1); } 50% { transform:scale(1.12); } }
    @keyframes pk-peek   { 0%,90%,100% { transform:translateY(0) rotate(0); } 45% { transform:translateY(-3px) rotate(-6deg); } }
    @keyframes pk-deal   { from { opacity:0; transform:scale(.6) translateY(18px); } to { opacity:1; transform:none; } }
    @keyframes pk-flash  { 0% { opacity:0; } 35% { opacity:.55; } 100% { opacity:0; } }
    @keyframes pk-stamp  { 0% { transform:scale(1.25); } 100% { transform:scale(1); } }
    @keyframes pk-jiggle { 0%,100% { transform:scale(1) rotate(0); } 30% { transform:scale(1.08) rotate(-5deg); } 60% { transform:scale(1.08) rotate(5deg); } }
    @keyframes pk-knock  { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-5px); } 75% { transform:translateX(5px); } }
    @keyframes pk-party  { 0%,100% { transform:translate(0,0); } 20% { transform:translate(-6px,3px); } 40% { transform:translate(6px,-3px); } 60% { transform:translate(-4px,-2px); } 80% { transform:translate(4px,2px); } }

    @media (prefers-reduced-motion: reduce) {
      .pk-emoji, .pk-eyes, .pk-curtain, .pk-door, .pk-grid, .pk-stage::after,
      .pk-shuffle, .big-prompt { transition:none !important; animation:none !important; }
      .pk-door.is-open .pk-emoji { transform:scale(1); }
      .pk-door:not(.is-open):hover .pk-emoji { transform:scale(0); }
    }
  `;
  document.head.appendChild(css);
}
