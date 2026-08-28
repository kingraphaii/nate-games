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
 * A 1–5 / 1–10 chip picks the counting range (persisted per device).
 *
 * Teaches: counting, one-to-one correspondence, numeral recognition, and
 * careful clicking. Uses the core/round.js shell for the frame and timers;
 * the tap-all count loop is its own (it is not a pick-one game).
 */
import { quizShell, modeChips } from '../../core/round.js';

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
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

// An ascending note per count, so the tally climbs in pitch as you go.
const COUNT_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'];

export default {
  id: 'numbers',
  title: 'Count With Me',
  emoji: '🔢',
  blurb: 'Tap each one and count out loud!',
  tags: ['numbers', 'counting'],

  mount(root, ctx) {
    injectStyles();
    const shell = quizShell(root, { className: 'numbers' });

    // The big tally numeral sits above the prompt.
    const tallyEl = document.createElement('span');
    tallyEl.className = 'numbers-tally';
    tallyEl.textContent = '0';
    shell.promptEl.before(tallyEl);

    const getMax = modeChips(shell, ctx, {
      key: 'max',
      options: [
        { id: 5, label: '1–5' },
        { id: 10, label: '1–10' },
      ],
      fallback: 5,
      onChange: () => round(),
    });

    let item = null;     // the object kind for this round
    let total = 0;       // how many to count this round
    let counted = 0;     // how many have been tapped so far
    let busy = false;    // lock during the win celebration

    function ask() {
      const what = total === 1 ? item.one : item.many;
      shell.setPrompt(`Tap and count the ${what}! ${item.emoji}`);
      ctx.speak(`Tap and count the ${what}!`);
    }

    function round() {
      busy = false;
      counted = 0;
      total = 1 + Math.floor(Math.random() * getMax());
      item = ctx.pick(ITEMS);

      tallyEl.textContent = '0';
      tallyEl.classList.remove('is-done');
      shell.gridEl.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const btn = document.createElement('button');
        btn.className = 'count-item pop-in';
        btn.setAttribute('aria-label', item.one);
        btn.innerHTML = `
          <span class="count-emoji">${item.emoji}</span>
          <span class="count-badge" aria-hidden="true"></span>`;
        ctx.activatable(btn, (hit) => onTap(btn, hit), { dwellMs: 900 });
        shell.gridEl.appendChild(btn);
      }
      ask();
    }

    function onTap(btn, hit) {
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

      if (counted === total) finish(hit);
    }

    function finish(hit) {
      busy = true;
      const what = total === 1 ? item.one : item.many;
      tallyEl.classList.add('is-done');
      shell.setPrompt(`${total} ${what}! ${item.emoji}🎉`);
      ctx.confetti(hit.x, hit.y);
      ctx.award?.();

      // Let the last count number land, then name the total and celebrate.
      shell.after(550, () => {
        ctx.audio.cheer();
        ctx.speak(`${NUMBER_WORDS[total] || total} ${what}! Great counting!`);
        shell.after(2200, round);
      });
    }

    shell.onStart(round);
    shell.onReplay(ask);
    shell.onNext(() => {
      if (!item) return;
      shell.clearTimers();
      round();
    });

    return shell.dispose;
  },
};

function injectStyles() {
  if (document.getElementById('numbers-styles')) return;
  const css = document.createElement('style');
  css.id = 'numbers-styles';
  css.textContent = `
    .numbers-tally { font-family:var(--font); font-weight:800; line-height:1;
      font-size:clamp(3.4rem, 12vw, 6rem); color:var(--primary);
      text-shadow:0 4px 0 rgba(0,0,0,0.12); }
    .numbers-tally.bump { animation:nuBump .32s ease; }
    .numbers-tally.is-done { color:var(--accent); animation:nuPop .5s ease; }
    @keyframes nuBump { 0%,100%{transform:scale(1)} 45%{transform:scale(1.28)} }
    @keyframes nuPop { 0%{transform:scale(0.6)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
    .numbers .round-grid { gap:18px; align-items:center; max-width:760px; }
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
