/**
 * Match It — color & shape matching game.
 *
 * One big "target" shape sits up top with a prompt: "Find the red star!".
 * Below are 3 choice cards; exactly one matches the target. Mode chips isolate
 * one concept at a time:
 *   Both   -> cards differ in shape and/or color (match both to win)
 *   Shapes -> every card shares one color, so only the shape matters
 *   Colors -> every card shares one shape, so only the color matters
 *   Correct → cheer, confetti, a happy wiggle, and the match is named aloud.
 *   Wrong   → a gentle shake and an "oops" (never punishing, never ends).
 *
 * Teaches: shape names, color names, and careful mouse aiming.
 * Built on the core/round.js quiz scaffold.
 */
import { quizShell, pickOneRound, modeChips } from '../../core/round.js';

// Kid-clear colors. `name` is what the narrator says; `hex` paints the SVG.
const COLORS = [
  { name: 'red', hex: '#ff4d4d' },
  { name: 'blue', hex: '#4d8bff' },
  { name: 'green', hex: '#3fc25b' },
  { name: 'yellow', hex: '#ffd43b' },
  { name: 'purple', hex: '#9b5de5' },
  { name: 'orange', hex: '#ff922b' },
  { name: 'pink', hex: '#ff8fab' },
  { name: 'teal', hex: '#20c997' },
  { name: 'brown', hex: '#a9714b' },
];

// Shape names the narrator speaks; geometry lives in shapeSVG().
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'oval', 'diamond', 'moon'];

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
    case 'oval':
      inner = `<ellipse cx="50" cy="50" rx="42" ry="29" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case 'diamond':
      inner = `<polygon points="50,8 88,50 50,92 12,50" fill="${color}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
      break;
    case 'moon':
      inner = `<path d="M64 10 A43 43 0 1 0 64 90 A34 34 0 1 1 64 10 Z" fill="${color}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
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
    injectStyles();
    const shell = quizShell(root, { className: 'match' });

    const getMode = modeChips(shell, ctx, {
      key: 'mode',
      options: [
        { id: 'both', label: 'Both' },
        { id: 'shape', label: 'Shapes' },
        { id: 'color', label: 'Colors' },
      ],
      fallback: 'both',
      onChange: () => loop.round(),
    });

    // Every card set is pairwise distinct, so any card can be the target.
    function makeCards() {
      const mode = getMode();
      if (mode === 'shape') {
        const color = ctx.pick(COLORS);
        return ctx.shuffle(SHAPES).slice(0, 3).map((shape) => ({ shape, color }));
      }
      if (mode === 'color') {
        const shape = ctx.pick(SHAPES);
        return ctx.shuffle(COLORS).slice(0, 3).map((color) => ({ shape, color }));
      }
      const cards = [];
      const seen = new Set();
      while (cards.length < 3) {
        const shape = ctx.pick(SHAPES);
        const color = ctx.pick(COLORS);
        const key = `${shape}|${color.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push({ shape, color });
      }
      return cards;
    }

    // What the round hunts for ("Find the <label>!") in the current mode.
    function label(card) {
      const mode = getMode();
      if (mode === 'shape') return card.shape;
      if (mode === 'color') return `${card.color.name} one`;
      return `${card.color.name} ${card.shape}`;
    }

    // What the win names ("Yes! <name>!") — the color alone in color mode.
    function winName(card) {
      return getMode() === 'color' ? card.color.name : label(card);
    }

    const loop = pickOneRound(shell, ctx, {
      choices: makeCards,
      cardClass: 'match-card',
      render: (card, btn) => {
        btn.innerHTML = shapeSVG(card.shape, card.color.hex, 110);
        btn.setAttribute('aria-label', `${card.color.name} ${card.shape}`);
      },
      ask: (target) => {
        // The big reference shape lives in the shell's reveal slot.
        shell.revealEl.innerHTML = shapeSVG(target.shape, target.color.hex, 120);
        shell.revealEl.classList.add('is-on');
        shell.setPrompt(`Find the ${label(target)}!`);
        ctx.speak(`Find the ${label(target)}!`);
      },
      onWin: (card, btn, hit) => {
        ctx.audio.cheer();
        ctx.confetti(hit.x, hit.y);
        btn.classList.add('wiggle');
        shell.setPrompt(`Yes! ${winName(card)}! 🎉`);
        ctx.speak(`Yes! ${winName(card)}!`);
        return { delayMs: 1700 };
      },
    });

    return shell.dispose;
  },
};

function injectStyles() {
  if (document.getElementById('match-styles')) return;
  const css = document.createElement('style');
  css.id = 'match-styles';
  css.textContent = `
    .match .round-reveal { min-height:120px; justify-content:center;
      filter:drop-shadow(0 8px 16px rgba(0,0,0,0.18)); }
    .match .round-reveal svg { width:clamp(90px,16vw,130px); height:clamp(90px,16vw,130px); }
    .match-card { width:clamp(120px,22vw,180px); height:clamp(120px,22vw,180px); border:none;
      border-radius:32px; background:var(--card-bg, #fff); box-shadow:var(--shadow); cursor:pointer; display:flex;
      align-items:center; justify-content:center; transition:transform .12s ease; }
    .match-card:hover { transform:translateY(-6px) scale(1.05); }
    .match-card:active { transform:scale(0.96); }
    .match-card svg { width:clamp(80px,15vw,120px); height:clamp(80px,15vw,120px); }
  `;
  document.head.appendChild(css);
}
