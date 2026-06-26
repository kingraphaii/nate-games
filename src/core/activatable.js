/**
 * activatable.js — "rest to activate" hover-dwell helper.
 *
 * Toddlers find a single click hard and a held drag harder. The friendliest
 * input is the one Trace Trails already uses: just *rest* the pointer on a
 * target. This wraps any element so it fires on EITHER a normal click OR the
 * cursor dwelling on it for ~0.9s — with a progress ring that traces the
 * element's own rounded outline so the action visibly "fills up". Moving away
 * before it completes cancels cleanly; nothing is ever a failure.
 *
 * Usage (from a game's mount, via ctx):
 *   ctx.activatable(button, (hit) => choose(entry, hit), { dwellMs: 900 });
 *
 * The callback receives a `hit` describing how it fired and where:
 *   { via: 'click' | 'dwell', x, y }   // x/y are viewport coords for confetti
 * For a dwell, x/y default to the element's center.
 *
 * Returns a disposer that detaches listeners and removes the ring. Listeners
 * live on the element itself, so clearing root.innerHTML on unmount tears it all
 * down too — calling the disposer is optional, just tidy.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export function makeActivatable(el, onActivate, opts = {}) {
  const dwellMs = opts.dwellMs ?? 900;
  let ring = null;   // <svg> progress overlay, created lazily on first dwell
  let rect = null;   // the traced <rect> inside it
  let anim = null;   // the running Web Animation
  let fired = false; // brief guard against a click + dwell double-fire
  let cooldown = null; // timer that releases `fired` so the element can re-fire

  function centerOf() {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function cancel() {
    if (anim) { anim.cancel(); anim = null; }
    if (ring) ring.style.opacity = '0';
  }

  function fire(via, ev) {
    if (fired) return;
    fired = true;
    cancel();
    const c = ev ? { x: ev.clientX, y: ev.clientY } : centerOf();
    onActivate({ via, x: c.x, y: c.y });
    // Release the guard shortly after so persistent targets (e.g. piano keys)
    // can be activated again. The brief window still blocks a click landing on
    // the same gesture that just completed a dwell.
    clearTimeout(cooldown);
    cooldown = setTimeout(() => { fired = false; }, 300);
  }

  /** Build (once) and size the ring to trace the element's current outline. */
  function ensureRing() {
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';

    if (!ring) {
      ring = document.createElementNS(SVG_NS, 'svg');
      ring.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
        + 'pointer-events:none;overflow:visible;opacity:0;transition:opacity .12s ease;';
      rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('fill', 'none');
      rect.style.stroke = 'var(--primary, #4dabf7)';
      rect.style.strokeLinecap = 'round';
      ring.appendChild(rect);
      el.appendChild(ring);
    }

    const w = el.clientWidth, h = el.clientHeight;
    const sw = Math.max(5, Math.min(w, h) * 0.06); // stroke width scales with size
    const inset = sw / 2 + 1;
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    const rx = Math.max(0, radius - inset);
    const iw = Math.max(0, w - inset * 2);
    const ih = Math.max(0, h - inset * 2);

    ring.setAttribute('viewBox', `0 0 ${w} ${h}`);
    rect.setAttribute('x', inset);
    rect.setAttribute('y', inset);
    rect.setAttribute('width', iw);
    rect.setAttribute('height', ih);
    rect.setAttribute('rx', rx);
    rect.setAttribute('ry', rx);
    rect.style.strokeWidth = String(sw);

    // Perimeter of a rounded rectangle: straight sides + the four quarter-arcs.
    return 2 * (iw + ih) - 8 * rx + 2 * Math.PI * rx;
  }

  /** Cursor came to rest — start filling the ring. */
  function start() {
    if (fired) return;
    const per = ensureRing();
    ring.style.opacity = '1';
    rect.style.strokeDasharray = String(per);
    if (anim) anim.cancel();
    anim = rect.animate(
      [{ strokeDashoffset: per }, { strokeDashoffset: 0 }],
      { duration: dwellMs, easing: 'linear', fill: 'forwards' },
    );
    anim.onfinish = () => fire('dwell');
  }

  // Dwell only makes sense for a hovering pointer (mouse/trackpad/pen). On touch
  // a tap fires enter→leave instantly, which would just flash the ring — so we
  // skip it and let the plain click handler activate instead.
  function onEnter(e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') start(); }
  function onLeave() { if (!fired) cancel(); }
  function onClick(e) { fire('click', e); }

  el.addEventListener('pointerenter', onEnter);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('pointercancel', onLeave);
  el.addEventListener('click', onClick);

  return function dispose() {
    clearTimeout(cooldown);
    cancel();
    el.removeEventListener('pointerenter', onEnter);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('pointercancel', onLeave);
    el.removeEventListener('click', onClick);
    ring?.remove();
  };
}
