/**
 * Animal Friends — listen-and-find game.
 *
 * The narrator asks "Where is the cow?" and the child picks the matching animal.
 * Correct → the animal says its name + sound, confetti, next round.
 * Wrong → a gentle wiggle and "try again" (never punishing).
 *
 * Teaches: animal vocabulary, listening, and careful mouse aiming.
 * This file is the REFERENCE game — it shows the core/round.js quiz scaffold
 * (shell + pick-one loop); copy its shape to make new quiz games.
 */
import { quizShell, pickOneRound } from '../../core/round.js';

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
  { name: 'Monkey', emoji: '🐵', sound: 'Ooh ooh ah ah' },
  { name: 'Penguin', emoji: '🐧', sound: 'Waddle waddle' },
  { name: 'Chicken', emoji: '🐔', sound: 'Cluck cluck' },
  { name: 'Goat', emoji: '🐐', sound: 'Maa maa' },
  { name: 'Mouse', emoji: '🐭', sound: 'Squeak squeak' },
  { name: 'Tiger', emoji: '🐯', sound: 'Grrr' },
  { name: 'Snake', emoji: '🐍', sound: 'Ssss' },
  { name: 'Bear', emoji: '🐻', sound: 'Growl' },
];

export default {
  id: 'animals',
  title: 'Animal Friends',
  emoji: '🐮',
  blurb: 'Listen, then find the animal!',
  tags: ['sounds', 'words', 'listening'],

  mount(root, ctx) {
    injectStyles();
    const shell = quizShell(root, { className: 'animals' });

    pickOneRound(shell, ctx, {
      choices: () => ctx.shuffle(ANIMALS).slice(0, 3),
      cardClass: 'animal-card',
      render: (animal, btn) => {
        btn.innerHTML = `<span class="animal-emoji">${animal.emoji}</span>`;
        btn.setAttribute('aria-label', animal.name);
      },
      ask: (target) => {
        shell.setPrompt(`Find the ${target.name}! ${target.emoji}`);
        ctx.speak(`Where is the ${target.name}?`);
      },
      onWin: (animal, btn, hit) => {
        ctx.audio.cheer();
        ctx.confetti(hit.x, hit.y);
        btn.classList.add('wiggle');
        shell.setPrompt(`${animal.name}! ${animal.emoji}`);
        ctx.speak(`${animal.name}! The ${animal.name} says ${animal.sound}!`);
        return { delayMs: 1900 };
      },
    });

    return shell.dispose;
  },
};

function injectStyles() {
  if (document.getElementById('animals-styles')) return;
  const css = document.createElement('style');
  css.id = 'animals-styles';
  css.textContent = `
    .animal-card { width:clamp(120px,22vw,200px); height:clamp(120px,22vw,200px); border:none;
      border-radius:32px; background:#fff; box-shadow:var(--shadow); cursor:pointer; display:flex;
      align-items:center; justify-content:center; transition:transform .12s ease; }
    .animal-card:hover { transform:translateY(-6px) scale(1.05); }
    .animal-card:active { transform:scale(0.96); }
    .animal-emoji { font-size:clamp(4rem,11vw,7rem); line-height:1; }
  `;
  document.head.appendChild(css);
}
