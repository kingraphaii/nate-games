/**
 * juice.js — Shared "game feel" helpers for the pop-style games
 * (Bubble Pop, Balloon Bash). Keeps the fun bits — combos, multipliers,
 * floating score popups, little pulses — in one place so both games feel
 * the same and stay tiny.
 *
 * Asset-free and self-contained: call injectJuiceStyles() once on mount.
 */

/** Colors for each multiplier tier (1x..5x). Index 0 is unused. */
export const COMBO_COLORS = ['#fff', '#ffffff', '#ffd166', '#ff9f43', '#ff6b9d', '#a55eea'];

/**
 * Tracks a streak of quick, consecutive pops and the multiplier it earns.
 * Pops that land within `windowMs` of each other keep the streak alive;
 * a gap resets it back to nothing.
 */
export class Combo {
  constructor({ windowMs = 1700 } = {}) {
    this.windowMs = windowMs;
    this.streak = 0;
    this._last = 0;
  }

  /** Register a pop at time `now` (ms). Returns { streak, mult, leveledUp }. */
  hit(now) {
    const prevMult = Combo.multFor(this.streak);
    if (now - this._last > this.windowMs) this.streak = 0; // window lapsed
    this._last = now;
    this.streak += 1;
    const mult = Combo.multFor(this.streak);
    return { streak: this.streak, mult, leveledUp: mult > prevMult };
  }

  /** How "full" the combo timer is right now (1 = just popped, 0 = expired). */
  fraction(now) {
    if (!this.streak) return 0;
    return Math.max(0, 1 - (now - this._last) / this.windowMs);
  }

  /** Reset the streak if its window has fully lapsed. Returns true if it did. */
  expire(now) {
    if (this.streak && now - this._last > this.windowMs) {
      this.streak = 0;
      return true;
    }
    return false;
  }

  /** Current multiplier without registering a pop. */
  get mult() {
    return Combo.multFor(this.streak);
  }

  /** Streak length -> multiplier. Gentle ramp so little ones can reach the top. */
  static multFor(streak) {
    if (streak >= 16) return 5;
    if (streak >= 11) return 4;
    if (streak >= 7) return 3;
    if (streak >= 3) return 2;
    return 1;
  }
}

/**
 * Drop a short-lived floating label at (x, y) inside `layer` (coords relative
 * to the layer). Rises, scales, and fades, then removes itself.
 */
export function floatText(layer, x, y, text, { color = '#fff', size = 1, big = false } = {}) {
  const el = document.createElement('div');
  el.className = 'juice-float' + (big ? ' juice-float--big' : '');
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.style.setProperty('--s', String(size));
  layer.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

/** Restart a CSS animation by toggling a class — handy for score "bumps". */
export function pulse(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // force reflow so the animation can replay
  el.classList.add(cls);
}

/** Inject the shared juice styles once per page. */
export function injectJuiceStyles() {
  if (document.getElementById('juice-styles')) return;
  const css = document.createElement('style');
  css.id = 'juice-styles';
  css.textContent = `
    .juice-float { position:absolute; transform:translate(-50%,-50%); pointer-events:none; z-index:6;
      font-family:var(--font); font-weight:900; white-space:nowrap;
      font-size:calc(1.5rem * var(--s,1));
      text-shadow:0 2px 6px rgba(0,0,0,0.35), 0 0 3px rgba(0,0,0,0.45);
      animation:juiceFloat .95s cubic-bezier(.2,.8,.3,1) forwards; }
    .juice-float--big { font-size:calc(2.4rem * var(--s,1)); letter-spacing:.5px; }
    @keyframes juiceFloat {
      0%   { opacity:0; transform:translate(-50%,-50%) scale(.5) rotate(-6deg); }
      22%  { opacity:1; transform:translate(-50%,-78%) scale(1.15) rotate(2deg); }
      100% { opacity:0; transform:translate(-50%,-185%) scale(1) rotate(-2deg); }
    }
    /* Combo meter chip: a label + a draining bar, shown only while comboing. */
    .juice-combo { display:inline-flex; align-items:center; gap:8px; margin-left:10px;
      padding:4px 12px; border-radius:999px; font-weight:900; color:#fff;
      background:linear-gradient(90deg,#ff9f43,#ff6b9d); box-shadow:0 4px 14px rgba(255,107,157,.4);
      opacity:0; transform:scale(.6) translateY(4px); transition:opacity .2s, transform .2s;
      font-size:clamp(.9rem,2.4vw,1.25rem); }
    .juice-combo.is-on { opacity:1; transform:scale(1) translateY(0); }
    .juice-combo .meter { width:46px; height:8px; border-radius:999px; overflow:hidden;
      background:rgba(255,255,255,.35); }
    .juice-combo .meter > i { display:block; height:100%; width:100%; background:#fff;
      transform-origin:left center; border-radius:999px; }
    .juice-combo.pop { animation:juiceComboPop .35s ease; }
    @keyframes juiceComboPop { 0%,100%{transform:scale(1)} 45%{transform:scale(1.22)} }
    /* Whole-screen flash + shake for big combo level-ups. */
    .juice-shake { animation:juiceShake .4s ease; }
    @keyframes juiceShake {
      0%,100%{transform:translate(0,0)} 20%{transform:translate(-5px,3px)}
      40%{transform:translate(5px,-3px)} 60%{transform:translate(-3px,-2px)} 80%{transform:translate(3px,2px)} }
  `;
  document.head.appendChild(css);
}
