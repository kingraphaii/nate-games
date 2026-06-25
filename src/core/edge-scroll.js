/**
 * edge-scroll.js — Mouse-position auto-scroll for a scroll container.
 *
 * Toddlers can't reliably grab a scrollbar or spin a wheel, so instead the
 * list scrolls on its own when the cursor drifts toward the top or bottom of
 * the area: push the mouse down → it scrolls down, ease back to the middle →
 * it stops. Speed ramps smoothly with how far into the edge "zone" the cursor
 * sits (gentle near the edge, never a lurch), and there's a big dead zone in
 * the middle so ordinary clicking never scrolls by accident.
 *
 * Enabled by a parent-controlled toggle (default ON), just like mute. The RAF
 * loop should only run while the target is on-screen — call start()/stop() on
 * navigation; the per-frame work is trivial and no-ops when there's nothing to
 * scroll, but stopping when hidden keeps things tidy.
 */
export class EdgeScroller {
  /** @param {HTMLElement} el  the overflow:auto scroll container (e.g. the game grid) */
  constructor(el) {
    this.el = el;
    this.enabled = true;   // user toggle
    this.px = null;        // last pointer position (viewport coords)
    this.py = null;
    this.raf = null;

    // Tuning. ZONE is capped so on short lists the edges don't swallow the
    // whole area; MAX is the top scroll speed in px/frame (~16 ≈ a brisk but
    // readable glide at 60fps).
    this.MAX = 16;
    this.MAX_ZONE = 150;

    this._onMove = (e) => { this.px = e.clientX; this.py = e.clientY; };
    window.addEventListener('pointermove', this._onMove, { passive: true });
  }

  setEnabled(on) { this.enabled = on; }

  start() {
    if (this.raf == null) this.raf = requestAnimationFrame(this._tick);
  }

  stop() {
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  _tick = () => {
    this.raf = requestAnimationFrame(this._tick);
    if (!this.enabled || this.py == null) return;
    const el = this.el;
    if (el.scrollHeight <= el.clientHeight + 1) return; // nothing to scroll

    const r = el.getBoundingClientRect();
    if (this.px < r.left || this.px > r.right) return;  // ignore the side margins / controls

    const zone = Math.min(this.MAX_ZONE, r.height * 0.3);

    let v = 0;
    // Bottom edge: trigger from (bottom - zone) and stay maxed below the grid
    // (over the footer) too, so pushing the mouse all the way down works.
    const downStart = r.bottom - zone;
    const upStart = r.top + zone;
    if (this.py > downStart) {
      v = clamp01((this.py - downStart) / zone) * this.MAX;
    } else if (this.py < upStart) {
      v = -clamp01((upStart - this.py) / zone) * this.MAX;
    }
    // Ease the ramp so the start of motion is extra gentle.
    if (v) el.scrollTop += Math.sign(v) * (v * v) / this.MAX;
  };

  destroy() {
    this.stop();
    window.removeEventListener('pointermove', this._onMove);
  }
}

function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }
