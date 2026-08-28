/**
 * round.js — Shared scaffolding for the round-based quiz games.
 *
 * The quiz games share one frame: a tap-to-start gate (browsers block speech
 * until a user gesture), a big prompt, 🔊 Say again / ▶ Next buttons, and a
 * timed advance to the next round. This module keeps that frame in one place
 * so each game is mostly data.
 *
 * Two layers, used together or alone:
 *   quizShell(root, opts)          -> the frame + managed timers. Any
 *       round-based game can use it on its own.
 *   pickOneRound(shell, ctx, spec) -> the "find the right card" loop
 *       (three choices, one correct, wrong picks shake — never punishing).
 *
 * The shell's `after(ms, fn)` is a managed setTimeout: `dispose()` clears every
 * pending timer, and the app runs it on unmount. Schedule round advances
 * through it so a game can never speak or re-render after the player leaves.
 */

/**
 * Build the shared quiz frame inside `root`.
 * Returns { promptEl, revealEl, gridEl, setPrompt, after, clearTimers,
 *           onStart, onReplay, onNext, dispose }.
 */
export function quizShell(root, { className = '', startText = 'Tap to start! 👆' } = {}) {
  injectShellStyles();

  root.innerHTML = `
    <div class="round ${className}">
      <p class="big-prompt"></p>
      <div class="round-reveal" aria-hidden="true"></div>
      <div class="round-controls">
        <button class="round-replay" title="Say it again">🔊 Say again</button>
        <button class="round-next" title="Try another">▶ Next</button>
      </div>
      <div class="round-grid"></div>
    </div>`;

  const shellEl = root.querySelector('.round');
  const promptEl = shellEl.querySelector('.big-prompt');
  const revealEl = shellEl.querySelector('.round-reveal');
  const gridEl = shellEl.querySelector('.round-grid');

  const timers = new Set();
  let started = false;
  let startFn = null;
  let replayFn = null;
  let nextFn = null;

  promptEl.textContent = startText;

  /** Managed setTimeout — cleared by dispose() so nothing outlives the game. */
  function after(ms, fn) {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
    return t;
  }

  function clearTimers() {
    for (const t of timers) clearTimeout(t);
    timers.clear();
  }

  // Wait for the first tap so speech is allowed to play (autoplay rules).
  // Button listeners run before this bubbling gate, and they no-op until
  // `started` is true — so the very first tap always just starts the game.
  shellEl.addEventListener('click', () => {
    if (started) return;
    started = true;
    startFn?.();
  });

  shellEl.querySelector('.round-replay').addEventListener('click', () => {
    if (started) replayFn?.();
  });
  shellEl.querySelector('.round-next').addEventListener('click', () => {
    if (started) nextFn?.();
  });

  return {
    shellEl,
    promptEl,
    revealEl,
    gridEl,
    setPrompt(text) { promptEl.textContent = text; },
    after,
    clearTimers,
    started() { return started; },
    onStart(fn) { startFn = fn; },
    onReplay(fn) { replayFn = fn; },
    onNext(fn) { nextFn = fn; },
    dispose() { clearTimers(); },
  };
}

/**
 * A persisted row of big mode chips (difficulty / mode selectors), rendered at
 * the top of the shell. Safe to expose to the child — chips only re-deal the
 * round, nothing is destructive.
 *
 *   modeChips(shell, ctx, { key, options, fallback, onChange })
 *     key      -> ctx.settings key the choice persists under
 *     options  -> [{ id, label }] (ids are JSON-safe: strings or numbers)
 *     fallback -> id used when nothing is stored yet
 *     onChange -> called with the new id after a tap re-deals (only once the
 *                 game has started; pending shell timers are cleared first)
 *
 * Returns a getter for the active id. Multiple calls stack chip groups in one
 * row (e.g. a letter-subset group next to an ABC/abc group).
 */
export function modeChips(shell, ctx, { key, options, fallback, onChange }) {
  let current = ctx.settings.get(key, fallback);
  // A stale stored id (option removed later) falls back silently.
  if (!options.some((o) => o.id === current)) current = fallback;

  let row = shell.shellEl.querySelector('.round-chips');
  if (!row) {
    row = document.createElement('div');
    row.className = 'round-chips';
    shell.shellEl.prepend(row);
  }

  const group = document.createElement('div');
  group.className = 'chip-group';
  for (const option of options) {
    const chip = document.createElement('button');
    chip.className = 'round-chip';
    chip.textContent = option.label;
    chip.classList.toggle('is-active', option.id === current);
    chip.setAttribute('aria-pressed', String(option.id === current));
    chip.addEventListener('click', () => {
      if (option.id === current) return;
      current = option.id;
      ctx.settings.set(key, current);
      for (const el of group.children) {
        const active = el === chip;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-pressed', String(active));
      }
      // Only re-deal a running game; before the start gate the tap that picked
      // the chip also starts the game (the shell's bubbling gate handles it).
      if (shell.started()) {
        shell.clearTimers();
        onChange?.(current);
      }
    });
    group.appendChild(chip);
  }
  row.appendChild(group);

  return () => current;
}

/**
 * The "find the right card" loop. `spec`:
 *   choices()               -> array of entries for this round (the target is
 *                              picked from it at random)
 *   cardClass               -> class for each card button (game styles it)
 *   render(entry, btn, i)   -> fill one card button
 *   ask(target)             -> set the prompt + speak the question
 *   onWin(entry, btn, hit)  -> celebrate; may return { delayMs } for the
 *                              advance to the next round (default 1900)
 *   dwellMs                 -> hover-dwell time for ctx.activatable (default 900)
 *
 * Every card fires on a tap OR on the cursor resting on it (ctx.activatable).
 * Wrong picks get the shake + a soft "oops" — never punishing.
 */
export function pickOneRound(shell, ctx, spec) {
  const dwellMs = spec.dwellMs ?? 900;
  let target = null;
  let busy = false; // lock during the win celebration

  function ask() {
    if (target) spec.ask(target);
  }

  function round() {
    busy = false;
    shell.revealEl.innerHTML = '';
    shell.revealEl.classList.remove('is-on');

    const choices = spec.choices();
    target = ctx.pick(choices);

    shell.gridEl.innerHTML = '';
    choices.forEach((entry, i) => {
      const btn = document.createElement('button');
      btn.className = `${spec.cardClass} pop-in`;
      spec.render(entry, btn, i);
      ctx.activatable(btn, (hit) => onPick(entry, btn, hit), { dwellMs });
      shell.gridEl.appendChild(btn);
    });
    ask();
  }

  function onPick(entry, btn, hit) {
    if (busy || !target) return;
    if (entry === target) {
      busy = true;
      const win = spec.onWin(entry, btn, hit) || {};
      ctx.award?.(); // a quiz win is a sticker milestone
      shell.after(win.delayMs ?? 1900, round);
    } else {
      ctx.audio.oops();
      btn.classList.remove('shake');
      void btn.offsetWidth; // restart the animation
      btn.classList.add('shake');
    }
  }

  shell.onStart(round);
  shell.onReplay(ask);
  // ▶ Next skips a round the child does not want — even mid-celebration.
  shell.onNext(() => {
    if (!target) return;
    shell.clearTimers();
    round();
  });

  return { round, ask };
}

function injectShellStyles() {
  if (document.getElementById('round-styles')) return;
  const css = document.createElement('style');
  css.id = 'round-styles';
  css.textContent = `
    .round { height:100%; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:14px; padding:16px; }
    .round-reveal { display:flex; align-items:center; gap:12px;
      opacity:0; transform:scale(0.6); transition:opacity .25s ease, transform .25s ease; }
    .round-reveal.is-on { opacity:1; transform:scale(1); }
    .round-controls { display:flex; gap:12px; }
    .round-replay, .round-next { padding:10px 20px; border:none; border-radius:999px;
      background:var(--accent); font-family:var(--font); font-size:1.1rem; font-weight:800;
      cursor:pointer; box-shadow:var(--shadow); }
    @media (hover: hover) {
      .round-replay:hover, .round-next:hover { transform:scale(1.05); }
    }
    .round-replay:active, .round-next:active { transform:scale(0.95); }
    .round-grid { display:flex; flex-wrap:wrap; gap:20px; justify-content:center; }
    .round-chips { display:flex; flex-wrap:wrap; gap:18px; justify-content:center; }
    .chip-group { display:flex; gap:8px; }
    /* Surface + text (not hard white) so an inactive chip stays readable on
       dark themes, matching the home theme chips. */
    .round-chip { min-height:44px; padding:8px 18px; border:none; border-radius:999px;
      background:var(--surface); opacity:0.8; font-family:var(--font); font-size:1rem; font-weight:800;
      color:var(--text); cursor:pointer; box-shadow:var(--shadow); transition:transform .12s ease; }
    .round-chip.is-active { background:var(--primary); color:#fff; opacity:1; }
    @media (hover: hover) { .round-chip:hover { transform:scale(1.06); } }
    .round-chip:active { transform:scale(0.94); }
  `;
  document.head.appendChild(css);
}
