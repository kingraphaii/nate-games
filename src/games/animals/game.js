/**
 * Animal Friends — listen-and-find game.
 *
 * The narrator asks "Where is the cow?" and the child clicks the matching animal.
 * Correct → the animal says its name + sound, confetti, next round.
 * Wrong → a gentle wiggle and "try again" (never punishing).
 *
 * Teaches: animal vocabulary, listening, and careful mouse aiming.
 * This file is the REFERENCE game — copy its shape to make new ones.
 */

const ANIMALS = [
  { name: 'Cow', emoji: '🐮', sound: 'Moo' },
  { name: 'Dog', emoji: '🐶', sound: 'Woof woof' },
  { name: 'Cat', emoji: '🐱', sound: 'Meow' },
  { name: 'Duck', emoji: '🦆', sound: 'Quack quack' },
  { name: 'Sheep', emoji: '🐑', sound: 'Baa' },
  { name: 'Pig', emoji: '🐷', sound: 'Oink' },
  { name: 'Frog', emoji: '🐸', sound: 'Ribbit' },
  { name: 'Lion', emoji: '🦁', sound: 'Roar' },
  { name: 'Horse', emoji: '🐴', sound: 'Neigh' },
  { name: 'Bee', emoji: '🐝', sound: 'Bzzzz' },
  { name: 'Owl', emoji: '🦉', sound: 'Hoo hoo' },
  { name: 'Elephant', emoji: '🐘', sound: 'Trumpet' },
];

export default {
  id: 'animals',
  title: 'Animal Friends',
  emoji: '🐮',
  blurb: 'Listen, then find the animal!',
  tags: ['sounds', 'words', 'listening'],

  mount(root, ctx) {
    let target = null;
    let busy = false;

    root.innerHTML = `
      <div class="animals">
        <p class="big-prompt" id="an-prompt">Tap to start! 👆</p>
        <button class="animals-replay" id="an-replay" title="Say it again">🔊 Say again</button>
        <div class="animals-grid" id="an-grid"></div>
      </div>`;

    injectStyles();
    const promptEl = root.querySelector('#an-prompt');
    const gridEl = root.querySelector('#an-grid');
    const replayEl = root.querySelector('#an-replay');

    function ask() {
      ctx.speak(`Where is the ${target.name}?`);
      promptEl.textContent = `Find the ${target.name}! ${target.emoji}`;
    }

    function nextRound() {
      busy = false;
      const choices = ctx.shuffle(ANIMALS).slice(0, 3);
      target = ctx.pick(choices);
      gridEl.innerHTML = '';
      for (const animal of choices) {
        const btn = document.createElement('button');
        btn.className = 'animal-card pop-in';
        btn.innerHTML = `<span class="animal-emoji">${animal.emoji}</span>`;
        btn.setAttribute('aria-label', animal.name);
        btn.addEventListener('click', (e) => onPick(animal, btn, e));
        gridEl.appendChild(btn);
      }
      ask();
    }

    function onPick(animal, btn, e) {
      if (busy) return;
      if (animal.name === target.name) {
        busy = true;
        ctx.audio.cheer();
        ctx.confetti(e.clientX, e.clientY);
        btn.classList.add('wiggle');
        promptEl.textContent = `${animal.name}! ${animal.emoji}`;
        ctx.speak(`${animal.name}! The ${animal.name} says ${animal.sound}!`);
        setTimeout(nextRound, 1900);
      } else {
        ctx.audio.oops();
        btn.classList.remove('shake');
        void btn.offsetWidth; // restart animation
        btn.classList.add('shake');
      }
    }

    replayEl.addEventListener('click', () => { if (target) ask(); });

    // Wait for the first tap so speech is allowed to play.
    const start = () => { nextRound(); };
    promptEl.closest('.animals').addEventListener('click', start, { once: true });

    return () => {}; // nothing global to clean up
  },
};

function injectStyles() {
  if (document.getElementById('animals-styles')) return;
  const css = document.createElement('style');
  css.id = 'animals-styles';
  css.textContent = `
    .animals { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:16px; }
    .animals-replay { padding:10px 20px; border:none; border-radius:999px; background:var(--accent);
      font-family:var(--font); font-size:1.1rem; font-weight:800; cursor:pointer; box-shadow:var(--shadow); }
    .animals-replay:hover { transform:scale(1.05); } .animals-replay:active { transform:scale(0.95); }
    .animals-grid { display:flex; flex-wrap:wrap; gap:20px; justify-content:center; }
    .animal-card { width:clamp(120px,22vw,200px); height:clamp(120px,22vw,200px); border:none;
      border-radius:32px; background:#fff; box-shadow:var(--shadow); cursor:pointer; display:flex;
      align-items:center; justify-content:center; transition:transform .12s ease; }
    .animal-card:hover { transform:translateY(-6px) scale(1.05); }
    .animal-card:active { transform:scale(0.96); }
    .animal-emoji { font-size:clamp(4rem,11vw,7rem); line-height:1; }
  `;
  document.head.appendChild(css);
}
