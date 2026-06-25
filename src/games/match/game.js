/**
 * Match It — color & shape matching game.
 *
 * One big "target" shape sits up top with a prompt: "Find the red star!".
 * Below are 3 choice cards; exactly one matches the target by BOTH shape
 * and color. The distractors differ in shape and/or color.
 *   Correct → cheer, confetti, a happy wiggle, and the shape is named aloud.
 *   Wrong   → a gentle shake and an "oops" (never punishing, never ends).
 *
 * Teaches: shape names, color names, and careful mouse aiming.
 * Modeled on the Animal Friends reference game.
 */

// Kid-clear colors. `name` is what the narrator says; `hex` paints the SVG.
const COLORS = [
  { name: 'red', hex: '#ff4d4d' },
  { name: 'blue', hex: '#4d8bff' },
  { name: 'green', hex: '#3fc25b' },
  { name: 'yellow', hex: '#ffd43b' },
  { name: 'purple', hex: '#9b5de5' },
  { name: 'orange', hex: '#ff922b' },
];

// Shape names the narrator speaks; geometry lives in shapeSVG().
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];

/**
 * Build an inline SVG string for a shape in a chosen color.
 * Inline (not emoji) so the color is fully controllable. Bold fill with a
 * subtle darker outline so every shape reads clearly for little eyes.
 */
function shapeSVG(shape, color, size) {
  const stroke = 'rgba(0,0,0,0.25)';
  const sw = 4; // outline width
  let inner = '';
  switch (shape) {
    case 'circle':
      inner = `<circle cx="50" cy="50" r="40" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case 'square':
      inner = `<rect x="14" y="14" width="72" height="72" rx="12" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case 'triangle':
      inner = `<polygon points="50,12 90,86 10,86" fill="${color}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
      break;
    case 'star':
      inner = `<polygon points="50,8 61,38 93,38 67,58 77,90 50,70 23,90 33,58 7,38 39,38" fill="${color}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
      break;
    case 'heart':
      inner = `<path d="M50 86 C18 62 12 40 28 28 C40 19 50 30 50 36 C50 30 60 19 72 28 C88 40 82 62 50 86 Z" fill="${color}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
      break;
    default:
      inner = `<circle cx="50" cy="50" r="40" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
}

export default {
  id: 'match',
  title: 'Match It',
  emoji: '🔶',
  blurb: 'Find the one that matches!',
  tags: ['shapes', 'colors'],

  mount(root, ctx) {
    let target = null;   // { shape, color } the player is hunting for
    let busy = false;    // lock during the win animation
    let timer = null;    // pending nextRound timer (cleared on cleanup)

    root.innerHTML = `
      <div class="match">
        <p class="big-prompt" id="ma-prompt">Tap to start! 👆</p>
        <div class="match-target" id="ma-target"></div>
        <button class="match-replay" id="ma-replay" title="Say it again">🔊 Say again</button>
        <div class="match-grid" id="ma-grid"></div>
      </div>`;

    injectStyles();
    const promptEl = root.querySelector('#ma-prompt');
    const targetEl = root.querySelector('#ma-target');
    const gridEl = root.querySelector('#ma-grid');
    const replayEl = root.querySelector('#ma-replay');

    function label() {
      return `${target.color.name} ${target.shape}`;
    }

    function ask() {
      ctx.speak(`Find the ${label()}!`);
      promptEl.textContent = `Find the ${label()}!`;
    }

    // Build 2 distractors that each differ from the target in shape, color,
    // or both — so exactly the target is a true shape+color match.
    function makeDistractors() {
      const out = [];
      const seen = new Set([`${target.shape}|${target.color.name}`]);
      while (out.length < 2) {
        const shape = ctx.pick(SHAPES);
        const color = ctx.pick(COLORS);
        const key = `${shape}|${color.name}`;
        // Skip if it duplicates the target or another card we already chose.
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ shape, color });
      }
      return out;
    }

    function nextRound() {
      busy = false;
      // Vary BOTH shape and color each round to keep it fresh.
      target = { shape: ctx.pick(SHAPES), color: ctx.pick(COLORS) };

      const cards = ctx.shuffle([target, ...makeDistractors()]);

      // Show the big reference shape up top.
      targetEl.innerHTML = shapeSVG(target.shape, target.color.hex, 120);

      gridEl.innerHTML = '';
      for (const card of cards) {
        const btn = document.createElement('button');
        btn.className = 'match-card pop-in';
        btn.innerHTML = shapeSVG(card.shape, card.color.hex, 110);
        btn.setAttribute('aria-label', `${card.color.name} ${card.shape}`);
        btn.addEventListener('click', (e) => onPick(card, btn, e));
        gridEl.appendChild(btn);
      }
      ask();
    }

    function isMatch(card) {
      return card.shape === target.shape && card.color.name === target.color.name;
    }

    function onPick(card, btn, e) {
      if (busy) return;
      if (isMatch(card)) {
        busy = true;
        ctx.audio.cheer();
        ctx.confetti(e.clientX, e.clientY);
        btn.classList.add('wiggle');
        const name = `${target.color.name} ${target.shape}`;
        promptEl.textContent = `Yes! ${name}! 🎉`;
        ctx.speak(`Yes! ${name}!`);
        timer = setTimeout(nextRound, 1700);
      } else {
        ctx.audio.oops();
        btn.classList.remove('shake');
        void btn.offsetWidth; // restart the shake animation
        btn.classList.add('shake');
      }
    }

    replayEl.addEventListener('click', () => { if (target) ask(); });

    // Wait for the first tap so speech is allowed to play (autoplay rules).
    const start = () => { nextRound(); };
    root.querySelector('.match').addEventListener('click', start, { once: true });

    // Cleanup: cancel any pending round timer.
    return () => { if (timer) clearTimeout(timer); };
  },
};

function injectStyles() {
  if (document.getElementById('match-styles')) return;
  const css = document.createElement('style');
  css.id = 'match-styles';
  css.textContent = `
    .match { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:16px; }
    .match-target { display:flex; align-items:center; justify-content:center; min-height:120px;
      filter:drop-shadow(0 8px 16px rgba(0,0,0,0.18)); }
    .match-target svg { width:clamp(90px,16vw,130px); height:clamp(90px,16vw,130px); }
    .match-replay { padding:10px 20px; border:none; border-radius:999px; background:var(--accent);
      font-family:var(--font); font-size:1.1rem; font-weight:800; cursor:pointer; box-shadow:var(--shadow); }
    .match-replay:hover { transform:scale(1.05); } .match-replay:active { transform:scale(0.95); }
    .match-grid { display:flex; flex-wrap:wrap; gap:20px; justify-content:center; }
    .match-card { width:clamp(120px,22vw,180px); height:clamp(120px,22vw,180px); border:none;
      border-radius:32px; background:#fff; box-shadow:var(--shadow); cursor:pointer; display:flex;
      align-items:center; justify-content:center; transition:transform .12s ease; }
    .match-card:hover { transform:translateY(-6px) scale(1.05); }
    .match-card:active { transform:scale(0.96); }
    .match-card svg { width:clamp(80px,15vw,120px); height:clamp(80px,15vw,120px); }
  `;
  document.head.appendChild(css);
}
