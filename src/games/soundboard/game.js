/**
 * Music Maker — a soundboard of big colorful buttons.
 *
 * Pure cause-and-effect joy: every tap makes an instant sound and a satisfying
 * visual pop. Seven buttons each play a note of the C-major scale; the eighth
 * is a "Song!" button that plays a short cheerful melody and bursts confetti.
 *
 * Teaches: cause and effect, listening, and that music is fun to make.
 * No "tap to start" gate is needed — the framework unlocks audio on the first
 * global pointerdown, and these buttons are themselves what gets tapped.
 */

// Seven scale notes, each with a bright distinct color and a friendly emoji.
// Colors march through the rainbow so each pad is easy to tell apart.
const PADS = [
  { note: 'C4', label: 'C', emoji: '🔴', color: '#ff5d5d' },
  { note: 'D4', label: 'D', emoji: '🟠', color: '#ff9f43' },
  { note: 'E4', label: 'E', emoji: '🟡', color: '#feca57' },
  { note: 'F4', label: 'F', emoji: '🟢', color: '#1dd1a1' },
  { note: 'G4', label: 'G', emoji: '🔵', color: '#48a9ff' },
  { note: 'A4', label: 'A', emoji: '🟣', color: '#9b6bff' },
  { note: 'B4', label: 'B', emoji: '🩷', color: '#ff6bd6' },
];

// A simple, original nursery-rhyme-ish tune for the Song! button.
// Climbs the scale and skips happily back down to the home note.
const SONG = [
  ['C4', 0.24], ['D4', 0.24], ['E4', 0.24], ['C4', 0.24],
  ['E4', 0.24], ['G4', 0.36], ['E4', 0.24], ['C4', 0.4],
];

export default {
  id: 'soundboard',
  title: 'Music Maker',
  emoji: '🎹',
  blurb: 'Tap the buttons to make music!',
  tags: ['music', 'sounds'],

  mount(root, ctx) {
    root.innerHTML = `
      <div class="soundboard">
        <p class="big-prompt">Tap to make music! 🎵</p>
        <div class="soundboard-grid" id="sb-grid"></div>
      </div>`;

    injectStyles();
    const gridEl = root.querySelector('#sb-grid');

    /** Flash a button: quick press feedback that always restarts cleanly. */
    function flash(btn) {
      btn.classList.remove('sb-flash');
      void btn.offsetWidth; // force reflow so the animation replays every tap
      btn.classList.add('sb-flash');
    }

    // Build the seven note pads.
    for (const pad of PADS) {
      const btn = document.createElement('button');
      btn.className = 'sb-pad pop-in';
      btn.style.setProperty('--pad-color', pad.color);
      btn.setAttribute('aria-label', `Note ${pad.label}`);
      btn.innerHTML = `
        <span class="sb-emoji">${pad.emoji}</span>
        <span class="sb-label">${pad.label}</span>`;
      btn.addEventListener('click', (e) => {
        ctx.audio.note(pad.note, { duration: 0.5, type: 'triangle' });
        flash(btn);
        // A tiny confetti spark at the fingertip for extra delight.
        ctx.confetti(e.clientX, e.clientY, { count: 8 });
      });
      gridEl.appendChild(btn);
    }

    // Build the eighth "Song!" button — plays the melody + a big celebration.
    const songBtn = document.createElement('button');
    songBtn.className = 'sb-pad sb-song pop-in';
    songBtn.setAttribute('aria-label', 'Play a song');
    songBtn.innerHTML = `
      <span class="sb-emoji">🎉</span>
      <span class="sb-label">Song!</span>`;
    songBtn.addEventListener('click', () => {
      ctx.audio.melody(SONG, { type: 'triangle', volume: 0.45 });
      flash(songBtn);
      // Confetti from the centre of the Song! button.
      const r = songBtn.getBoundingClientRect();
      ctx.confetti(r.left + r.width / 2, r.top + r.height / 2);
    });
    gridEl.appendChild(songBtn);

    return () => {}; // nothing global to clean up
  },
};

function injectStyles() {
  if (document.getElementById('soundboard-styles')) return;
  const css = document.createElement('style');
  css.id = 'soundboard-styles';
  css.textContent = `
    .soundboard { height:100%; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:14px; padding:16px; }
    .soundboard-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));
      gap:16px; width:100%; max-width:720px; }
    .sb-pad { display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:6px; aspect-ratio:1; min-height:110px; border:none; border-radius:26px;
      background:var(--pad-color, var(--primary)); color:#fff; font-family:var(--font);
      cursor:pointer; box-shadow:var(--shadow); transition:transform .12s ease, box-shadow .12s ease; }
    .sb-pad:hover { transform:translateY(-6px) scale(1.05); box-shadow:0 18px 40px rgba(0,0,0,0.3); }
    .sb-pad:active { transform:scale(0.93); }
    .sb-emoji { font-size:clamp(2.6rem, 8vw, 3.6rem); line-height:1; }
    .sb-label { font-size:clamp(1.1rem, 3vw, 1.5rem); font-weight:800;
      text-shadow:0 2px 4px rgba(0,0,0,0.25); }
    /* The Song! button is a warm celebratory gradient so it stands apart. */
    .sb-song { background:linear-gradient(135deg, #ff7a59, #ffd166); }
    /* Bright flash + bounce on every press for big, satisfying feedback. */
    .sb-flash { animation:sbFlash 0.4s ease; }
    @keyframes sbFlash {
      0%   { transform:scale(0.9); filter:brightness(1.6); }
      40%  { transform:scale(1.08); filter:brightness(1.3); }
      100% { transform:scale(1); filter:brightness(1); }
    }
  `;
  document.head.appendChild(css);
}
