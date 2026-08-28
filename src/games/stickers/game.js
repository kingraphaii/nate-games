/**
 * Sticker Book — the collection every game feeds.
 *
 * One shelf per game. Earned stickers are full color and speak their name on
 * a tap; unearned slots are dimmed mystery silhouettes with a "?" so there is
 * always something to look forward to — never a failure state. A big counter
 * celebrates the total. The catalog and the earning rules live in
 * core/stickers.js; this module only renders.
 */
import { CATALOG, stickerState } from '../../core/stickers.js';

export default {
  id: 'stickers',
  title: 'Sticker Book',
  emoji: '📖',
  blurb: 'See the stickers you have won!',
  tags: ['rewards', 'collection'],

  mount(root, ctx) {
    injectStyles();
    const state = stickerState();
    const earned = new Set(state.earned);

    const book = document.createElement('div');
    book.className = 'stickerbook';

    const count = earned.size;
    const head = document.createElement('div');
    head.className = 'sb-head';
    head.innerHTML = count === 0
      ? `<p class="big-prompt">Play games to win stickers! 🎁</p>`
      : `<p class="big-prompt">${count} sticker${count === 1 ? '' : 's'}! 🎉</p>`;
    book.appendChild(head);

    for (const set of Object.values(CATALOG)) {
      const shelf = document.createElement('section');
      shelf.className = 'sb-shelf';
      shelf.innerHTML = `<h3 class="sb-shelf-title">${set.emoji} ${set.title}</h3>`;
      const row = document.createElement('div');
      row.className = 'sb-row';

      for (const sticker of set.items) {
        if (earned.has(sticker.id)) {
          const btn = document.createElement('button');
          btn.className = 'sb-sticker is-earned pop-in';
          btn.innerHTML = `<span class="sb-emoji">${sticker.emoji}</span>`;
          btn.setAttribute('aria-label', sticker.name);
          btn.addEventListener('click', () => {
            btn.classList.remove('wiggle');
            void btn.offsetWidth; // restart the animation
            btn.classList.add('wiggle');
            ctx.audio.pop({ pitch: 1.2 });
            ctx.speak(sticker.name);
          });
          row.appendChild(btn);
        } else {
          const slot = document.createElement('div');
          slot.className = 'sb-sticker is-locked';
          slot.innerHTML = `<span class="sb-emoji">${sticker.emoji}</span><span class="sb-mystery">?</span>`;
          row.appendChild(slot);
        }
      }
      shelf.appendChild(row);
      book.appendChild(shelf);
    }

    root.appendChild(book);
    return () => {};
  },
};

function injectStyles() {
  if (document.getElementById('stickers-styles')) return;
  const css = document.createElement('style');
  css.id = 'stickers-styles';
  css.textContent = `
    .stickerbook { height:100%; overflow-y:auto; touch-action:pan-y; padding:18px 16px 40px;
      display:flex; flex-direction:column; align-items:center; gap:18px; }
    .sb-head { text-align:center; }
    .sb-shelf { width:100%; max-width:820px; display:flex; flex-direction:column;
      align-items:center; gap:10px; }
    .sb-shelf-title { margin:0; font-family:var(--font); font-weight:800; color:var(--text);
      font-size:clamp(1.1rem,3.4vw,1.5rem); }
    .sb-row { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
    .sb-sticker { position:relative; width:clamp(64px,12vw,96px); height:clamp(64px,12vw,96px);
      border:none; border-radius:22px; background:#fff; box-shadow:var(--shadow);
      display:flex; align-items:center; justify-content:center; }
    .sb-sticker.is-earned { cursor:pointer; transition:transform .12s ease; }
    @media (hover: hover) { .sb-sticker.is-earned:hover { transform:translateY(-4px) scale(1.08); } }
    .sb-sticker.is-earned:active { transform:scale(0.92); }
    .sb-emoji { font-size:clamp(2.2rem,7vw,3.4rem); line-height:1; }
    /* A locked slot shows only a mystery silhouette — an invitation, not a failure. */
    .sb-sticker.is-locked { background:rgba(255,255,255,0.55); }
    .sb-sticker.is-locked .sb-emoji { filter:grayscale(1) brightness(0); opacity:0.12; }
    .sb-mystery { position:absolute; inset:0; display:flex; align-items:center;
      justify-content:center; font-family:var(--font); font-weight:800;
      font-size:clamp(1.6rem,5vw,2.4rem); color:var(--text); opacity:0.45; }
  `;
  document.head.appendChild(css);
}
