/**
 * Letter Sounds — alphabet recognition + phonics.
 *
 * The narrator asks "Find the letter B!" and shows three big letter cards.
 * Tap the right one and it teaches the phonics: "B says buh, buh — Ball!",
 * reveals the example picture, bursts confetti, and moves on. A wrong tap
 * gives a gentle shake and an "oops" — never punishing.
 *
 * Two chip groups (persisted per device):
 *   A–F / A–M / All  -> the letter pool, so a new learner starts small
 *   ABC / abc        -> uppercase or lowercase glyphs (speech is the same)
 *
 * Teaches: letter recognition, letter–sound correspondence (phonics), and
 * careful mouse aiming. Built on the core/round.js quiz scaffold.
 */
import { quizShell, pickOneRound, modeChips } from '../../core/round.js';

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

// How many letters each pool chip opens up (from the start of the alphabet).
const POOLS = { af: 6, am: 13, all: 26 };

// Bright card backgrounds, cycled so each choice is easy to tell apart.
const CARD_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#9775fa', '#ff922b'];

export default {
  id: 'letters',
  title: 'Letter Sounds',
  emoji: '🔤',
  blurb: 'Find the letter and learn its sound!',
  tags: ['letters', 'phonics', 'reading'],

  mount(root, ctx) {
    injectStyles();
    const shell = quizShell(root, { className: 'letters' });

    const getPool = modeChips(shell, ctx, {
      key: 'pool',
      options: [
        { id: 'af', label: 'A–F' },
        { id: 'am', label: 'A–M' },
        { id: 'all', label: 'All' },
      ],
      fallback: 'all',
      onChange: () => loop.round(),
    });
    const getCase = modeChips(shell, ctx, {
      key: 'case',
      options: [
        { id: 'upper', label: 'ABC' },
        { id: 'lower', label: 'abc' },
      ],
      fallback: 'upper',
      onChange: () => loop.round(),
    });

    // The glyph shown on cards and in the prompt; speech always says the name.
    function glyph(entry) {
      return getCase() === 'lower' ? entry.letter.toLowerCase() : entry.letter;
    }

    // Optional recorded phonics: assets/sounds/phonics/<letter>.mp3. Only clips
    // in the manifest are fetched; missing ones fall back to the spoken phonics.
    const phonicsUrl = (entry) =>
      new URL(`assets/sounds/phonics/${entry.letter.toLowerCase()}.mp3`, document.baseURI).href;
    ctx.audio.preloadSet?.('phonics', LETTERS.map((e) => e.letter.toLowerCase()));

    const loop = pickOneRound(shell, ctx, {
      choices: () => ctx.shuffle(LETTERS.slice(0, POOLS[getPool()])).slice(0, 3),
      cardClass: 'letter-card',
      render: (entry, btn, i) => {
        btn.style.setProperty('--card', CARD_COLORS[i % CARD_COLORS.length]);
        btn.textContent = glyph(entry);
        btn.setAttribute('aria-label', `Letter ${entry.letter}`);
      },
      ask: (target) => {
        shell.setPrompt(`Find the letter ${glyph(target)}!`);
        ctx.speak(`Find the letter ${target.letter}!`);
      },
      onWin: (entry, btn, hit) => {
        ctx.audio.cheer();
        ctx.confetti(hit.x, hit.y);
        btn.classList.add('wiggle');

        // Reveal the phonics: letter, its sound, and an example word + picture.
        shell.setPrompt(`${glyph(entry)} says “${entry.sound}” — ${entry.word}!`);
        shell.revealEl.innerHTML = `<span class="reveal-emoji">${entry.emoji}</span>
          <span class="reveal-word">${entry.word}</span>`;
        shell.revealEl.classList.add('is-on');
        // A tuned recorded phonics clip if we have it; otherwise the spoken
        // cadence (name, sound twice, word) — the original, unchanged with no files.
        const played = ctx.audio.playSample?.(phonicsUrl(entry), {
          fallback: () => ctx.speak(`${entry.letter}. ${entry.sound}, ${entry.sound}, ${entry.word}!`),
        });
        // With a real clip, name the example word once the sound has played.
        if (played) shell.after(1200, () => ctx.speak(`${entry.word}!`));
        return { delayMs: 2600 };
      },
    });

    return shell.dispose;
  },
};

function injectStyles() {
  if (document.getElementById('letters-styles')) return;
  const css = document.createElement('style');
  css.id = 'letters-styles';
  css.textContent = `
    .letters .round-reveal { min-height:60px; }
    .reveal-emoji { font-size:clamp(2.6rem,7vw,3.6rem); line-height:1; }
    .reveal-word { font-family:var(--font); font-weight:800; color:var(--text);
      font-size:clamp(1.4rem,4vw,2rem); }
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
