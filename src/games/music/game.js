/**
 * Music Party — three little music toys in one game.
 *
 * A mode-select screen leads to three ways to make music, all built on a
 * shared beat clock so taps land in time:
 *
 *   🥁 Make a Band  — tap friends to toggle looping layers (drums, bass,
 *                     chords, a tune, sparkles). They bounce on the beat and
 *                     stack into a whole song. Pure "I built this!" magic.
 *   🎵 Play a Song  — a light-up keyboard guides little fingers through real
 *                     nursery tunes (Twinkle, Mary, Old MacDonald). The next
 *                     key glows; tap it to play the melody yourself.
 *   🪩 Dance Party  — tap anywhere to drop a singing creature onto a groove.
 *                     Everyone is tuned to a pentatonic scale, so it always
 *                     sounds good. Fill the screen with a bouncing choir.
 *
 * Everything is synthesized (no audio files) and forgiving — there is no way
 * to lose. Replaces the old static soundboard.
 */

// ---------------------------------------------------------------------------
// Shared beat clock. 16 eighth-note steps (= two bars) at a steady tempo.
// A plain setInterval keeps every layer locked to the SAME tick, which is all
// a toddler music toy needs — sample-accurate scheduling would be overkill.
// ---------------------------------------------------------------------------
const STEPS = 16;
function makeTransport(onStep, bpm = 108) {
  const stepMs = 60000 / bpm / 2; // an eighth note in ms
  let id = null;
  let step = 0;
  return {
    start() {
      if (id) return;
      step = 0;
      onStep(0);
      id = setInterval(() => {
        step = (step + 1) % STEPS;
        onStep(step);
      }, stepMs);
    },
    stop() {
      if (id) { clearInterval(id); id = null; }
    },
    stepMs,
  };
}

// Which chord region a step falls in: a I–V–vi–IV loop in C (C, G, Am, F).
const region = (s) => (s < 4 ? 0 : s < 8 ? 1 : s < 12 ? 2 : 3);
const BASS_ROOTS = [130.81, 98.0, 110.0, 87.31];          // C3, G2, A2, F2
const CHORDS = [
  ['C4', 'E4', 'G4'], ['D4', 'G4', 'B4'],
  ['E4', 'A4', 'C5'], ['F4', 'A4', 'C5'],
];

// Small percussion voices, kept soft for little ears.
const kick = (a) => a.tone(120, { duration: 0.18, type: 'sine', volume: 0.5, glide: 0.35 });
const snare = (a) => a.burst({ pitch: 1.8, volume: 0.32 });
const hat = (a) => a.tone(7600, { duration: 0.025, type: 'square', volume: 0.05 });

// ---------------------------------------------------------------------------
// BAND mode layers. Each `trigger(a, step)` plays its part for this step and
// returns true if the character should bounce (i.e. it actually hit).
// ---------------------------------------------------------------------------
const MELODY = ['E5', null, 'D5', null, 'G4', 'G4', null, 'D5',
                'C5', null, 'A4', 'C5', 'A4', null, 'G4', null];
const SPARKLE = { 2: 'C6', 6: 'A5', 10: 'C6', 14: 'G5' };
const ON_BEAT = (s) => s % 4 === 0; // the four downbeats: steps 0,4,8,12

const LAYERS = [
  {
    id: 'drums', emoji: '🥁', name: 'Drums', color: '#ff5d5d', on: true,
    trigger(a, s) {
      if (s % 2 === 1) hat(a);
      if (ON_BEAT(s)) kick(a);
      if (s === 4 || s === 12) snare(a);
      return ON_BEAT(s);
    },
  },
  {
    id: 'bass', emoji: '🎸', name: 'Bass', color: '#48a9ff', on: true,
    trigger(a, s) {
      if (!ON_BEAT(s)) return false;
      a.note(BASS_ROOTS[region(s)], { duration: 0.24, type: 'sawtooth', volume: 0.42 });
      return true;
    },
  },
  {
    id: 'chords', emoji: '🎹', name: 'Chords', color: '#1dd1a1', on: false,
    trigger(a, s) {
      if (!ON_BEAT(s)) return false;
      a.chord(CHORDS[region(s)], { duration: 1.0, type: 'sine', volume: 0.15 });
      return true;
    },
  },
  {
    id: 'melody', emoji: '🎺', name: 'Tune', color: '#ffb14e', on: false,
    trigger(a, s) {
      const n = MELODY[s];
      if (n) a.note(n, { duration: 0.26, type: 'triangle', volume: 0.4 });
      return !!n;
    },
  },
  {
    id: 'sparkle', emoji: '✨', name: 'Sparkle', color: '#9b6bff', on: false,
    trigger(a, s) {
      const n = SPARKLE[s];
      if (n) a.note(n, { duration: 0.2, type: 'sine', volume: 0.26 });
      return !!n;
    },
  },
];

// ---------------------------------------------------------------------------
// SONG mode: a fixed one-octave keyboard + a few public-domain nursery tunes
// (melody only). Every tune fits within C4..B4, so seven white keys cover all.
// ---------------------------------------------------------------------------
const KEYS = [
  { note: 'C4', label: 'C', color: '#ff5d5d' },
  { note: 'D4', label: 'D', color: '#ff9f43' },
  { note: 'E4', label: 'E', color: '#feca57' },
  { note: 'F4', label: 'F', color: '#1dd1a1' },
  { note: 'G4', label: 'G', color: '#48a9ff' },
  { note: 'A4', label: 'A', color: '#9b6bff' },
  { note: 'B4', label: 'B', color: '#ff6bd6' },
];

const SONGS = [
  { name: 'Twinkle Twinkle', emoji: '⭐',
    notes: ['C4','C4','G4','G4','A4','A4','G4','F4','F4','E4','E4','D4','D4','C4'] },
  { name: 'Mary Had a Little Lamb', emoji: '🐑',
    notes: ['E4','D4','C4','D4','E4','E4','E4','D4','D4','D4','E4','G4','G4'] },
  { name: 'Old MacDonald', emoji: '🐮',
    notes: ['G4','G4','G4','D4','E4','E4','D4','B4','B4','A4','A4','G4'] },
];

// ---------------------------------------------------------------------------
// DANCE mode: a pentatonic scale (always consonant) and a cast of singers.
// ---------------------------------------------------------------------------
const DANCE_SCALE = ['C4','D4','E4','G4','A4','C5','D5','E5','G5','A5'];
const DANCE_FACES = ['🐸','🐰','🐱','🦊','🐥','🐶','🐼','🐵','🦄','🐙','🐝','🐧','🐤','🦋'];
const MAX_DANCERS = 16;

export default {
  id: 'music',
  title: 'Music Party',
  emoji: '🎶',
  blurb: 'Build a band, play a song, or throw a dance party!',
  tags: ['music', 'sounds', 'cause-effect'],

  mount(root, ctx) {
    injectStyles();
    ctx.audio.unlock?.();

    root.innerHTML = `<div class="mz"><div class="mz-stage" id="mz-stage"></div></div>`;
    const stage = root.querySelector('#mz-stage');

    let cleanupMode = null;
    function clearMode() {
      if (cleanupMode) { try { cleanupMode(); } catch (e) { console.error(e); } cleanupMode = null; }
      stage.innerHTML = '';
    }

    function showMenu() {
      clearMode();
      stage.innerHTML = `
        <div class="mz-menu">
          <p class="big-prompt">Pick a music game! 🎶</p>
          <div class="mz-cards" id="mz-cards"></div>
        </div>`;
      const cards = stage.querySelector('#mz-cards');
      for (const m of MENU) {
        const card = document.createElement('button');
        card.className = 'mz-card pop-in';
        card.style.setProperty('--card-color', m.color);
        card.innerHTML = `
          <span class="mz-card-emoji">${m.emoji}</span>
          <span class="mz-card-name">${m.name}</span>
          <span class="mz-card-blurb">${m.blurb}</span>`;
        card.addEventListener('click', () => {
          ctx.audio.unlock();
          ctx.audio.pop({ pitch: 1.15 });
          clearMode();
          cleanupMode = m.start(stage, ctx, showMenu);
        });
        cards.appendChild(card);
      }
    }

    showMenu();
    return () => clearMode();
  },
};

// Menu definition wires each card to its mode starter.
const MENU = [
  { id: 'band', emoji: '🥁', name: 'Make a Band', color: '#ff5d5d',
    blurb: 'Tap friends to add drums, bass & a tune', start: startBand },
  { id: 'song', emoji: '🎵', name: 'Play a Song', color: '#48a9ff',
    blurb: 'Follow the lights to play real songs', start: startSong },
  { id: 'dance', emoji: '🪩', name: 'Dance Party', color: '#9b6bff',
    blurb: 'Tap anywhere to fill the screen with singers', start: startDance },
];

/** A reusable "◀ Back" pill that returns to the mode menu. */
function backBar(onBack, audio) {
  const bar = document.createElement('div');
  bar.className = 'mz-topbar';
  const back = document.createElement('button');
  back.className = 'mz-back';
  back.innerHTML = '◀ Back';
  back.addEventListener('click', () => { audio.pop(); onBack(); });
  bar.appendChild(back);
  return { bar, back };
}

/** Re-trigger a quick bounce animation on an element. */
function bounce(el) {
  el.classList.remove('mz-hit');
  void el.offsetWidth;
  el.classList.add('mz-hit');
}

// ===========================================================================
// MODE: Make a Band
// ===========================================================================
function startBand(stage, ctx, onBack) {
  const a = ctx.audio;
  stage.innerHTML = `<div class="mz-mode mz-band-mode"></div>`;
  const mode = stage.querySelector('.mz-mode');

  const { bar } = backBar(onBack, a);
  mode.appendChild(bar);

  const prompt = document.createElement('p');
  prompt.className = 'big-prompt';
  prompt.textContent = 'Tap friends to play together! 🥁';
  mode.appendChild(prompt);

  // A small pulsing heart-beat so the tempo is visible even with nothing on.
  const beat = document.createElement('div');
  beat.className = 'mz-beat';
  beat.innerHTML = '🎵';
  mode.appendChild(beat);

  const band = document.createElement('div');
  band.className = 'mz-band';
  mode.appendChild(band);

  // Each layer keeps its own `active` flag and DOM node.
  const layers = LAYERS.map((def) => {
    const el = document.createElement('button');
    el.className = 'mz-friend pop-in' + (def.on ? ' is-on' : '');
    el.style.setProperty('--friend-color', def.color);
    el.setAttribute('aria-label', def.name);
    el.innerHTML = `
      <span class="mz-friend-emoji">${def.emoji}</span>
      <span class="mz-friend-name">${def.name}</span>`;
    const layer = { def, el, active: def.on };
    el.addEventListener('click', () => {
      a.unlock();
      layer.active = !layer.active;
      el.classList.toggle('is-on', layer.active);
      a.pop({ pitch: layer.active ? 1.3 : 0.7 });
      bounce(el);
    });
    band.appendChild(el);
    return layer;
  });

  const transport = makeTransport((step) => {
    if (ON_BEAT(step)) bounce(beat);
    for (const layer of layers) {
      if (!layer.active) continue;
      const hit = layer.def.trigger(a, step);
      if (hit) bounce(layer.el);
    }
  });
  transport.start();

  return () => transport.stop();
}

// ===========================================================================
// MODE: Play a Song (light-up follow-along keyboard)
// ===========================================================================
function startSong(stage, ctx, onBack) {
  const a = ctx.audio;
  stage.innerHTML = `<div class="mz-mode mz-song-mode"></div>`;
  const mode = stage.querySelector('.mz-mode');

  const { bar } = backBar(onBack, a);
  // Song picker + Listen button live in the top bar.
  const picker = document.createElement('div');
  picker.className = 'mz-songs';
  bar.appendChild(picker);
  const listenBtn = document.createElement('button');
  listenBtn.className = 'mz-listen';
  listenBtn.innerHTML = '👂 Listen';
  bar.appendChild(listenBtn);
  mode.appendChild(bar);

  const prompt = document.createElement('p');
  prompt.className = 'big-prompt';
  mode.appendChild(prompt);

  const progress = document.createElement('div');
  progress.className = 'mz-progress';
  mode.appendChild(progress);

  const keyboard = document.createElement('div');
  keyboard.className = 'mz-keyboard';
  mode.appendChild(keyboard);

  let songIdx = 0;
  let noteIdx = 0;
  let demoing = false;
  const timers = [];
  const disposers = [];

  // Build the seven keys once; map note -> element for quick highlight.
  const keyEls = {};
  for (const key of KEYS) {
    const el = document.createElement('button');
    el.className = 'mz-key';
    el.style.setProperty('--key-color', key.color);
    el.setAttribute('aria-label', `Note ${key.label}`);
    el.innerHTML = `<span class="mz-key-label">${key.label}</span>`;
    keyEls[key.note] = el;
    // Dwell-friendly: a resting cursor counts as a tap.
    disposers.push(ctx.activatable(el, ({ x, y }) => onKey(key, el, x, y), { dwellMs: 700 }));
    keyboard.appendChild(el);
  }

  // Build the song-picker chips.
  SONGS.forEach((song, i) => {
    const chip = document.createElement('button');
    chip.className = 'mz-song-chip';
    chip.innerHTML = `${song.emoji} ${song.name.split(' ')[0]}`;
    chip.title = song.name;
    chip.addEventListener('click', () => { a.pop(); selectSong(i, true); });
    picker.appendChild(chip);
  });

  function selectSong(i, announce) {
    songIdx = i;
    noteIdx = 0;
    demoing = false;
    picker.querySelectorAll('.mz-song-chip').forEach((c, j) =>
      c.classList.toggle('is-active', j === i));
    renderProgress();
    updateHighlight();
    if (announce) ctx.speak(SONGS[i].name, { rate: 0.9 });
  }

  function renderProgress() {
    const song = SONGS[songIdx];
    progress.innerHTML = '';
    song.notes.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'mz-dot' + (i < noteIdx ? ' is-done' : '');
      progress.appendChild(dot);
    });
  }

  function updateHighlight() {
    Object.values(keyEls).forEach((el) => el.classList.remove('is-next'));
    const song = SONGS[songIdx];
    if (noteIdx < song.notes.length) {
      keyEls[song.notes[noteIdx]]?.classList.add('is-next');
      prompt.textContent = 'Tap the glowing key! ✨';
    }
  }

  function onKey(key, el, x, y) {
    if (demoing) return;
    a.unlock();
    a.note(key.note, { duration: 0.5, type: 'triangle' });
    bounce(el);
    const song = SONGS[songIdx];
    // Right note? advance + sparkle. Wrong note? just play it — no penalty.
    if (noteIdx < song.notes.length && key.note === song.notes[noteIdx]) {
      noteIdx++;
      progress.children[noteIdx - 1]?.classList.add('is-done');
      ctx.confetti(x, y, { count: 8 });
      if (noteIdx >= song.notes.length) finishSong();
      else updateHighlight();
    }
  }

  function finishSong() {
    const song = SONGS[songIdx];
    prompt.textContent = `🎉 You played ${song.name}!`;
    Object.values(keyEls).forEach((el) => el.classList.remove('is-next'));
    a.cheer();
    ctx.speak(`Hooray! You played ${song.name}!`);
    const r = keyboard.getBoundingClientRect();
    ctx.confetti(r.left + r.width / 2, r.top + r.height / 2, { count: 40 });
    timers.push(setTimeout(() => { noteIdx = 0; renderProgress(); updateHighlight(); }, 2400));
  }

  // "Listen" plays the tune and lights each key in time, then hands back over.
  listenBtn.addEventListener('click', () => {
    a.unlock();
    const song = SONGS[songIdx];
    demoing = true;
    Object.values(keyEls).forEach((el) => el.classList.remove('is-next'));
    prompt.textContent = `👂 Listen to ${song.name}…`;
    const dur = 0.34, gapS = 0.06, stepMs = (dur + gapS) * 1000;
    a.melody(song.notes.map((n) => [n, dur]), { type: 'triangle', volume: 0.4, gap: gapS });
    song.notes.forEach((n, i) => {
      timers.push(setTimeout(() => {
        const el = keyEls[n];
        if (el) bounce(el);
      }, i * stepMs));
    });
    timers.push(setTimeout(() => { demoing = false; updateHighlight(); }, song.notes.length * stepMs));
  });

  selectSong(0, false);

  return () => {
    timers.forEach(clearTimeout);
    disposers.forEach((d) => d());
  };
}

// ===========================================================================
// MODE: Dance Party (tap anywhere to add a singing creature)
// ===========================================================================
function startDance(stage, ctx, onBack) {
  const a = ctx.audio;
  stage.innerHTML = `<div class="mz-mode mz-dance-mode"></div>`;
  const mode = stage.querySelector('.mz-mode');

  const { bar } = backBar(onBack, a);
  const hint = document.createElement('span');
  hint.className = 'mz-hint';
  hint.textContent = 'Tap anywhere to add a dancer! 🪩';
  bar.appendChild(hint);
  mode.appendChild(bar);

  const floor = document.createElement('div');
  floor.className = 'mz-floor';
  mode.appendChild(floor);

  const dancers = [];

  function spawn(clientX, clientY) {
    a.unlock();
    const rect = floor.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    // Keep the crowd manageable: retire the oldest dancer once full.
    if (dancers.length >= MAX_DANCERS) {
      const old = dancers.shift();
      old.el.remove();
    }
    const note = ctx.pick(DANCE_SCALE);
    const el = document.createElement('div');
    el.className = 'mz-dancer pop-in';
    el.textContent = ctx.pick(DANCE_FACES);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    floor.appendChild(el);
    // phase spreads singers across the bar so notes don't all stack up.
    dancers.push({ el, note, phase: dancers.length % 4 });
    a.note(note, { duration: 0.4, type: 'triangle', volume: 0.4 });
    bounce(el);
    ctx.confetti(clientX, clientY, { count: 10 });
  }

  // Tapping the floor adds a dancer; the back button (in the bar) is separate.
  const onPointer = (e) => spawn(e.clientX, e.clientY);
  floor.addEventListener('pointerdown', onPointer);

  // A gentle backing groove plays the whole time; dancers sing on their phase.
  const transport = makeTransport((step) => {
    if (ON_BEAT(step)) kick(a);
    if (step % 2 === 1) hat(a);
    for (const d of dancers) {
      if (step % 4 === d.phase) {
        a.note(d.note, { duration: 0.32, type: 'triangle', volume: 0.3 });
        bounce(d.el);
      }
    }
  });
  transport.start();

  return () => {
    transport.stop();
    floor.removeEventListener('pointerdown', onPointer);
  };
}

// ===========================================================================
// Styles
// ===========================================================================
function injectStyles() {
  if (document.getElementById('music-styles')) return;
  const css = document.createElement('style');
  css.id = 'music-styles';
  css.textContent = `
    .mz { height:100%; }
    .mz-stage { height:100%; }
    .mz-mode, .mz-menu { height:100%; display:flex; flex-direction:column;
      align-items:center; gap:12px; padding:12px 16px; }
    .mz-menu { justify-content:center; }

    /* ---- Top bar (back + per-mode controls) ---- */
    .mz-topbar { width:100%; max-width:760px; display:flex; align-items:center;
      flex-wrap:wrap; gap:10px; }
    .mz-back { padding:9px 18px; border:none; border-radius:999px; background:var(--surface);
      color:var(--text); font-family:var(--font); font-size:1.05rem; font-weight:800;
      cursor:pointer; box-shadow:var(--shadow); }
    .mz-back:hover { transform:scale(1.05); } .mz-back:active { transform:scale(0.95); }

    /* ---- Mode menu cards ---- */
    .mz-cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
      gap:18px; width:100%; max-width:760px; }
    .mz-card { display:flex; flex-direction:column; align-items:center; gap:6px;
      padding:24px 16px; border:none; border-radius:var(--radius); cursor:pointer;
      background:linear-gradient(160deg, var(--card-color), color-mix(in srgb, var(--card-color) 60%, #000 10%));
      color:#fff; font-family:var(--font); box-shadow:var(--shadow);
      transition:transform .12s ease, box-shadow .12s ease; }
    .mz-card:hover { transform:translateY(-6px) scale(1.03); box-shadow:0 18px 40px rgba(0,0,0,0.3); }
    .mz-card:active { transform:scale(0.96); }
    .mz-card-emoji { font-size:clamp(3rem, 9vw, 4rem); line-height:1; }
    .mz-card-name { font-size:clamp(1.2rem, 3.4vw, 1.6rem); font-weight:800;
      text-shadow:0 2px 4px rgba(0,0,0,0.25); }
    .mz-card-blurb { font-size:0.95rem; opacity:0.95; text-align:center; }

    /* ---- Shared bounce on a beat hit ---- */
    .mz-hit { animation:mzHit 0.22s ease; }
    @keyframes mzHit { 0%{transform:scale(0.88)} 45%{transform:scale(1.12)} 100%{transform:scale(1)} }

    /* ---- Band ---- */
    .mz-beat { font-size:2rem; }
    .mz-band { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));
      gap:16px; width:100%; max-width:720px; margin-top:4px; }
    .mz-friend { display:flex; flex-direction:column; align-items:center; gap:6px;
      aspect-ratio:1; min-height:120px; border:none; border-radius:24px; cursor:pointer;
      font-family:var(--font); color:#fff; box-shadow:var(--shadow);
      background:#9aa0b5; filter:grayscale(0.7) brightness(0.85); opacity:0.7;
      transition:transform .12s ease, filter .2s ease, opacity .2s ease; }
    .mz-friend.is-on { background:var(--friend-color); filter:none; opacity:1; }
    .mz-friend:hover { transform:translateY(-5px) scale(1.04); }
    .mz-friend:active { transform:scale(0.94); }
    .mz-friend-emoji { font-size:clamp(2.6rem, 8vw, 3.4rem); line-height:1; }
    .mz-friend-name { font-size:clamp(1rem, 3vw, 1.3rem); font-weight:800;
      text-shadow:0 2px 4px rgba(0,0,0,0.25); }

    /* ---- Song / keyboard ---- */
    .mz-songs { display:flex; gap:8px; flex-wrap:wrap; flex:1; }
    .mz-song-chip, .mz-listen { padding:8px 14px; border:none; border-radius:999px;
      background:var(--surface); color:var(--text); font-family:var(--font);
      font-size:1rem; font-weight:800; cursor:pointer; box-shadow:var(--shadow); }
    .mz-song-chip.is-active { background:var(--accent); }
    .mz-song-chip:hover, .mz-listen:hover { transform:scale(1.05); }
    .mz-song-chip:active, .mz-listen:active { transform:scale(0.95); }

    .mz-progress { display:flex; gap:7px; flex-wrap:wrap; justify-content:center;
      max-width:560px; min-height:16px; }
    .mz-dot { width:14px; height:14px; border-radius:50%; background:rgba(0,0,0,0.18);
      transition:background .2s ease, transform .2s ease; }
    .mz-dot.is-done { background:var(--accent); transform:scale(1.15); }

    .mz-keyboard { display:flex; gap:10px; width:100%; max-width:720px; flex:1;
      align-items:stretch; padding-bottom:8px; }
    .mz-key { position:relative; flex:1; min-width:0; border:none; border-radius:18px;
      cursor:pointer; color:#fff; font-family:var(--font); box-shadow:var(--shadow);
      background:var(--key-color); display:flex; align-items:flex-end; justify-content:center;
      padding-bottom:14px; transition:transform .1s ease; }
    .mz-key:hover { transform:translateY(-4px); } .mz-key:active { transform:scale(0.96); }
    .mz-key-label { font-size:clamp(1.2rem, 4vw, 2rem); font-weight:800;
      text-shadow:0 2px 4px rgba(0,0,0,0.3); }
    /* The key you should tap next: glow + gentle wiggle. */
    .mz-key.is-next { animation:mzGlow 1s ease-in-out infinite; outline:4px solid #fff;
      outline-offset:-4px; }
    @keyframes mzGlow { 0%,100%{transform:translateY(0); filter:brightness(1)}
      50%{transform:translateY(-8px); filter:brightness(1.4)} }

    /* ---- Dance floor ---- */
    .mz-hint { font-size:1.1rem; font-weight:800; color:var(--text); }
    .mz-floor { position:relative; flex:1; width:100%; max-width:900px; border-radius:24px;
      background:rgba(255,255,255,0.10); box-shadow:inset 0 0 0 3px rgba(255,255,255,0.18);
      overflow:hidden; touch-action:none; cursor:pointer; }
    .mz-dancer { position:absolute; transform:translate(-50%,-50%); font-size:clamp(2.4rem,7vw,3.4rem);
      pointer-events:none; line-height:1; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3)); }

    @media (prefers-reduced-motion: reduce) {
      .mz-hit, .mz-key.is-next { animation:none !important; }
    }
  `;
  document.head.appendChild(css);
}
