/**
 * Count With Me — a tap-to-count number game.
 *
 * A handful of friendly objects appear (e.g. 3 ducks). The narrator says
 * "Tap and count the ducks!", and as the child taps each one it bounces, gets
 * a numbered badge, and the narrator counts out loud — "one... two... three!".
 * A big numeral at the top grows with each tap so the spoken word, the quantity,
 * and the written digit all line up. Finish the set → cheer, confetti, and the
 * total is named ("Three ducks!"). Then a fresh round.
 *
 * Teaches: counting 1–5, one-to-one correspondence, numeral recognition, and
 * careful clicking. Modeled on the Animal Friends reference game.
 */

// Objects to count. Each has a singular + plural name (for natural speech)
// and a big, cheerful emoji.
const ITEMS = [
  { one: 'apple', many: 'apples', emoji: '🍎' },
  { one: 'duck', many: 'ducks', emoji: '🦆' },
  { one: 'star', many: 'stars', emoji: '⭐' },
  { one: 'balloon', many: 'balloons', emoji: '🎈' },
  { one: 'fish', many: 'fish', emoji: '🐠' },
  { one: 'car', many: 'cars', emoji: '🚗' },
  { one: 'cookie', many: 'cookies', emoji: '🍪' },
  { one: 'flower', many: 'flowers', emoji: '🌸' },
  { one: 'frog', many: 'frogs', emoji: '🐸' },
  { one: 'banana', many: 'bananas', emoji: '🍌' },
];

// Spoken number words, indexed by the number itself (NUMBER_WORDS[3] === 'three').
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

// An ascending note per count, so the tally climbs in pitch as you go.
const COUNT_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'];

const MAX_COUNT = 5; // toddler-friendly range: counts of 1–5

export default {
  id: 'numbers',
  title: 'Count With Me',
  emoji: '🔢',
  blurb: 'Tap each one and count out loud!',
  tags: ['numbers', 'counting'],

  mount(root, ctx) {
    let item = null;     // the object kind for this round
    let total = 0;       // how many to count this round
    let counted = 0;     // how many have been tapped so far
    let busy = false;    // lock during the win celebration
    let timer = null;    // pending nextRound timer (cleared on cleanup)

    root.innerHTML = `
      <div class="numbers">
        <div class="numbers-top">
          <span class="numbers-tally" id="nu-tally">0</span>
          <p class="big-prompt numbers-prompt" id="nu-prompt">Tap to start! 👆</p>
        </div>
        <button class="numbers-replay" id="nu-replay" title="Say it again">🔊 Say again</button>
        <div class="numbers-grid" id="nu-grid"></div>
      </div>`;

    injectStyles();
    const promptEl = root.querySelector('#nu-prompt');
    const tallyEl = root.querySelector('#nu-tally');
    const gridEl = root.querySelector('#nu-grid');
    const replayEl = root.querySelector('#nu-replay');

    function ask() {
      const what = total === 1 ? item.one : item.many;
      promptEl.textContent = `Tap and count the ${what}! ${item.emoji}`;
      ctx.speak(`Tap and count the ${what}!`);
    }

    function nextRound() {
      busy = false;
      counted = 0;
      total = 1 + Math.floor(Math.random() * MAX_COUNT); // 1..MAX_COUNT
      item = ctx.pick(ITEMS);

      tallyEl.textContent = '0';
      tallyEl.classList.remove('is-done');
      gridEl.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const btn = document.createElement('button');
        btn.className = 'count-item pop-in';
        btn.setAttribute('aria-label', item.one);
        btn.innerHTML = `
          <span class="count-emoji">${item.emoji}</span>
          <span class="count-badge" aria-hidden="true"></span>`;
        btn.addEventListener('click', (e) => onTap(btn, e));
        gridEl.appendChild(btn);
      }
      ask();
    }

    function onTap(btn, e) {
      if (busy || btn.classList.contains('is-counted')) return;

      counted += 1;
      btn.classList.add('is-counted', 'wiggle');
      btn.querySelector('.count-badge').textContent = String(counted);

      // Connect quantity → numeral → spoken word, all at once.
      tallyEl.textContent = String(counted);
      tallyEl.classList.remove('bump');
      void tallyEl.offsetWidth; // restart the bump animation
      tallyEl.classList.add('bump');
      ctx.audio.note(COUNT_NOTES[counted] || 'C5', { duration: 0.35, type: 'triangle' });
      ctx.speak(NUMBER_WORDS[counted] || String(counted));

      if (counted === total) finish(e);
    }

    function finish(e) {
      busy = true;
      const what = total === 1 ? item.one : item.many;
      tallyEl.classList.add('is-done');
      promptEl.textContent = `${total} ${what}! ${item.emoji}🎉`;
      ctx.confetti(e.clientX, e.clientY);

      // Let the last count number land, then name the total and celebrate.
      timer = setTimeout(() => {
        ctx.audio.cheer();
        ctx.speak(`${NUMBER_WORDS[total] || total} ${what}! Great counting!`);
        timer = setTimeout(nextRound, 2200);
      }, 550);
    }

    replayEl.addEventListener('click', () => { if (item) ask(); });

    // Wait for the first tap so speech is allowed to play (autoplay rules).
    root.querySelector('.numbers').addEventListener('click', () => nextRound(), { once: true });

    // Cleanup: cancel any pending timers.
    return () => { if (timer) clearTimeout(timer); };
  },
};

function injectStyles() {
  if (document.getElementById('numbers-styles')) return;
  const css = document.createElement('style');
  css.id = 'numbers-styles';
  css.textContent = `
    .numbers { height:100%; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:12px; padding:16px; }
    .numbers-top { display:flex; flex-direction:column; align-items:center; gap:4px; }
    .numbers-tally { font-family:var(--font); font-weight:800; line-height:1;
      font-size:clamp(3.4rem, 12vw, 6rem); color:var(--primary);
      text-shadow:0 4px 0 rgba(0,0,0,0.12); }
    .numbers-tally.bump { animation:nuBump .32s ease; }
    .numbers-tally.is-done { color:var(--accent); animation:nuPop .5s ease; }
    @keyframes nuBump { 0%,100%{transform:scale(1)} 45%{transform:scale(1.28)} }
    @keyframes nuPop { 0%{transform:scale(0.6)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
    .numbers-prompt { margin:0; }
    .numbers-replay { padding:10px 20px; border:none; border-radius:999px; background:var(--accent);
      font-family:var(--font); font-size:1.1rem; font-weight:800; cursor:pointer; box-shadow:var(--shadow); }
    .numbers-replay:hover { transform:scale(1.05); } .numbers-replay:active { transform:scale(0.95); }
    .numbers-grid { display:flex; flex-wrap:wrap; gap:18px; justify-content:center; align-items:center;
      max-width:760px; }
    .count-item { position:relative; width:clamp(96px,18vw,150px); height:clamp(96px,18vw,150px);
      border:none; border-radius:28px; background:#fff; box-shadow:var(--shadow); cursor:pointer;
      display:flex; align-items:center; justify-content:center; transition:transform .12s ease, opacity .2s ease; }
    .count-item:hover { transform:translateY(-6px) scale(1.05); }
    .count-item:active { transform:scale(0.95); }
    .count-emoji { font-size:clamp(3.2rem,9vw,5rem); line-height:1; }
    /* A counted item dims a little and shows its order number. */
    .count-item.is-counted { background:#eafff0; }
    .count-item.is-counted .count-emoji { opacity:0.55; }
    .count-badge { position:absolute; top:-10px; right:-10px; min-width:38px; height:38px;
      display:flex; align-items:center; justify-content:center; padding:0 8px;
      border-radius:999px; background:var(--primary); color:#fff; font-family:var(--font);
      font-weight:800; font-size:1.3rem; box-shadow:0 4px 10px rgba(0,0,0,0.25);
      transform:scale(0); transition:transform .18s cubic-bezier(0.18,0.89,0.32,1.28); }
    .count-item.is-counted .count-badge { transform:scale(1); }
  `;
  document.head.appendChild(css);
}
