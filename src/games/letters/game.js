/**
 * Letter Sounds — alphabet recognition + phonics.
 *
 * The narrator asks "Find the letter B!" and shows three big letter cards.
 * Tap the right one and it teaches the phonics: "B says buh, buh — Ball!",
 * reveals the example picture, bursts confetti, and moves on. A wrong tap
 * gives a gentle shake and an "oops" — never punishing.
 *
 * Teaches: uppercase letter recognition, letter–sound correspondence (phonics),
 * and careful mouse aiming. Modeled on the Match It / Animal Friends reference.
 */

// Each letter carries its phonics "sound" (spelled how it sounds when spoken
// aloud) and a friendly example word + emoji. Sounds use the common short/hard
// phonics value taught first in kindergarten.
const LETTERS = [
  { letter: 'A', sound: 'ah',   word: 'Apple',   emoji: '🍎' },
  { letter: 'B', sound: 'buh',  word: 'Ball',    emoji: '⚽' },
  { letter: 'C', sound: 'kuh',  word: 'Cat',     emoji: '🐱' },
  { letter: 'D', sound: 'duh',  word: 'Dog',     emoji: '🐶' },
  { letter: 'E', sound: 'eh',   word: 'Egg',     emoji: '🥚' },
  { letter: 'F', sound: 'ff',   word: 'Fish',    emoji: '🐠' },
  { letter: 'G', sound: 'guh',  word: 'Goat',    emoji: '🐐' },
  { letter: 'H', sound: 'huh',  word: 'Hat',     emoji: '🎩' },
  { letter: 'I', sound: 'ih',   word: 'Igloo',   emoji: '🛖' },
  { letter: 'J', sound: 'juh',  word: 'Juice',   emoji: '🧃' },
  { letter: 'K', sound: 'kuh',  word: 'Kite',    emoji: '🪁' },
  { letter: 'L', sound: 'luh',  word: 'Lion',    emoji: '🦁' },
  { letter: 'M', sound: 'mmm',  word: 'Moon',    emoji: '🌙' },
  { letter: 'N', sound: 'nuh',  word: 'Nose',    emoji: '👃' },
  { letter: 'O', sound: 'ah',   word: 'Octopus', emoji: '🐙' },
  { letter: 'P', sound: 'puh',  word: 'Pig',     emoji: '🐷' },
  { letter: 'Q', sound: 'kwuh', word: 'Queen',   emoji: '👑' },
  { letter: 'R', sound: 'ruh',  word: 'Rainbow', emoji: '🌈' },
  { letter: 'S', sound: 'sss',  word: 'Sun',     emoji: '☀️' },
  { letter: 'T', sound: 'tuh',  word: 'Tree',    emoji: '🌳' },
  { letter: 'U', sound: 'uh',   word: 'Umbrella',emoji: '☂️' },
  { letter: 'V', sound: 'vuh',  word: 'Van',     emoji: '🚐' },
  { letter: 'W', sound: 'wuh',  word: 'Whale',   emoji: '🐳' },
  { letter: 'X', sound: 'ks',   word: 'Fox',     emoji: '🦊' },
  { letter: 'Y', sound: 'yuh',  word: 'Yo-yo',   emoji: '🪀' },
  { letter: 'Z', sound: 'zzz',  word: 'Zebra',   emoji: '🦓' },
];

// Bright card backgrounds, cycled so each choice is easy to tell apart.
const CARD_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#9775fa', '#ff922b'];

export default {
  id: 'letters',
  title: 'Letter Sounds',
  emoji: '🔤',
  blurb: 'Find the letter and learn its sound!',
  tags: ['letters', 'phonics', 'reading'],

  mount(root, ctx) {
    let target = null;   // the LETTERS entry to find this round
    let busy = false;    // lock during the win animation
    let timer = null;    // pending nextRound timer (cleared on cleanup)

    root.innerHTML = `
      <div class="letters">
        <p class="big-prompt" id="le-prompt">Tap to start! 👆</p>
        <div class="letters-reveal" id="le-reveal" aria-hidden="true"></div>
        <button class="letters-replay" id="le-replay" title="Say it again">🔊 Say again</button>
        <div class="letters-grid" id="le-grid"></div>
      </div>`;

    injectStyles();
    const promptEl = root.querySelector('#le-prompt');
    const revealEl = root.querySelector('#le-reveal');
    const gridEl = root.querySelector('#le-grid');
    const replayEl = root.querySelector('#le-replay');

    function ask() {
      promptEl.textContent = `Find the letter ${target.letter}!`;
      ctx.speak(`Find the letter ${target.letter}!`);
    }

    function nextRound() {
      busy = false;
      revealEl.innerHTML = '';
      revealEl.classList.remove('is-on');

      const choices = ctx.shuffle(LETTERS).slice(0, 3);
      target = ctx.pick(choices);

      gridEl.innerHTML = '';
      choices.forEach((entry, i) => {
        const btn = document.createElement('button');
        btn.className = 'letter-card pop-in';
        btn.style.setProperty('--card', CARD_COLORS[i % CARD_COLORS.length]);
        btn.textContent = entry.letter;
        btn.setAttribute('aria-label', `Letter ${entry.letter}`);
        btn.addEventListener('click', (e) => onPick(entry, btn, e));
        gridEl.appendChild(btn);
      });
      ask();
    }

    function onPick(entry, btn, e) {
      if (busy) return;
      if (entry.letter === target.letter) {
        busy = true;
        ctx.audio.cheer();
        ctx.confetti(e.clientX, e.clientY);
        btn.classList.add('wiggle');

        // Reveal the phonics: letter, its sound, and an example word + picture.
        promptEl.textContent = `${entry.letter} says “${entry.sound}” — ${entry.word}!`;
        revealEl.innerHTML = `<span class="reveal-emoji">${entry.emoji}</span>
          <span class="reveal-word">${entry.word}</span>`;
        revealEl.classList.add('is-on');
        // Phonics cadence: name, then sound twice, then the example word.
        ctx.speak(`${entry.letter}. ${entry.sound}, ${entry.sound}, ${entry.word}!`);

        timer = setTimeout(nextRound, 2600);
      } else {
        ctx.audio.oops();
        btn.classList.remove('shake');
        void btn.offsetWidth; // restart the shake animation
        btn.classList.add('shake');
      }
    }

    replayEl.addEventListener('click', () => { if (target) ask(); });

    // Wait for the first tap so speech is allowed to play (autoplay rules).
    root.querySelector('.letters').addEventListener('click', () => nextRound(), { once: true });

    // Cleanup: cancel any pending round timer.
    return () => { if (timer) clearTimeout(timer); };
  },
};

function injectStyles() {
  if (document.getElementById('letters-styles')) return;
  const css = document.createElement('style');
  css.id = 'letters-styles';
  css.textContent = `
    .letters { height:100%; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:12px; padding:16px; }
    .letters-reveal { display:flex; align-items:center; gap:12px; min-height:60px;
      opacity:0; transform:scale(0.6); transition:opacity .25s ease, transform .25s ease; }
    .letters-reveal.is-on { opacity:1; transform:scale(1); }
    .reveal-emoji { font-size:clamp(2.6rem,7vw,3.6rem); line-height:1; }
    .reveal-word { font-family:var(--font); font-weight:800; color:var(--text);
      font-size:clamp(1.4rem,4vw,2rem); }
    .letters-replay { padding:10px 20px; border:none; border-radius:999px; background:var(--accent);
      font-family:var(--font); font-size:1.1rem; font-weight:800; cursor:pointer; box-shadow:var(--shadow); }
    .letters-replay:hover { transform:scale(1.05); } .letters-replay:active { transform:scale(0.95); }
    .letters-grid { display:flex; flex-wrap:wrap; gap:20px; justify-content:center; }
    .letter-card { width:clamp(110px,20vw,170px); height:clamp(110px,20vw,170px); border:none;
      border-radius:30px; background:var(--card, var(--primary)); color:#fff; cursor:pointer;
      box-shadow:var(--shadow); font-family:var(--font); font-weight:800;
      font-size:clamp(4rem,11vw,7rem); line-height:1; text-shadow:0 4px 0 rgba(0,0,0,0.18);
      display:flex; align-items:center; justify-content:center; transition:transform .12s ease; }
    .letter-card:hover { transform:translateY(-6px) scale(1.05); }
    .letter-card:active { transform:scale(0.95); }
  `;
  document.head.appendChild(css);
}
