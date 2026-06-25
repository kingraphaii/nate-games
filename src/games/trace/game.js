/**
 * Trace Trails — a gentle "follow the path" mouse trainer.
 *
 * A simple shape (line, rainbow, zig-zag, circle, square, triangle) is laid out
 * as a faint dashed guide with big numbered dots along it. The NEXT dot pulses
 * to invite. The player just slides the pointer over it — no clicking, no
 * dragging — and the crayon trail draws forward, the dot lights up, and the next
 * note of a rising scale plays. Reaching the last dot bursts confetti, cheers,
 * and speaks praise; after a short beat the next shape appears.
 *
 * Fully forgiving: only the *next* dot in order responds, so stray moves and
 * out-of-order passes simply do nothing — there is no failure sound.
 *
 * Teaches: smooth pointer tracking and following a path — the skill between
 * "click a target" (Bubble Pop) and full drag-and-drop.
 * Built the same shape as the Animal Friends REFERENCE game.
 */

// Rising scale — one note per dot reached, so a finished shape plays a melody.
const SCALE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];

// Spoken praise on completing a shape (picked at random, used sparingly).
const PRAISE = ['You did it!', 'Beautiful!', 'Great tracing!', 'Wow, perfect!', 'Nice job!'];

// ---- Path makers -----------------------------------------------------------
// All points are normalized 0..1 inside a centered square play region, so every
// shape stays crisp and round on any screen size.

/** n evenly spaced points along a straight line from (x1,y1) to (x2,y2). */
function linePts(x1, y1, x2, y2, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return out;
}

/** n points along an arc, center (cx,cy) radius r, sweeping angle a0..a1 (rad). */
function arcPts(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const a = a0 + (a1 - a0) * t;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

/** Concatenate point lists, dropping the duplicated joint between segments. */
function joinPts(...segs) {
  const out = [];
  for (const seg of segs) {
    let s = seg;
    if (out.length && s.length) {
      const [px, py] = out[out.length - 1];
      const [sx, sy] = s[0];
      if (Math.hypot(px - sx, py - sy) < 0.001) s = s.slice(1);
    }
    out.push(...s);
  }
  return out;
}

const SHAPES = [
  { name: 'line', emoji: '➖', points: linePts(0.12, 0.5, 0.88, 0.5, 7) },
  // Rainbow arch: top half-circle, left to right.
  { name: 'rainbow', emoji: '🌈', points: arcPts(0.5, 0.66, 0.38, Math.PI, 0, 9) },
  // Zig-zag mountains.
  {
    name: 'zig-zag', emoji: '⚡',
    points: [
      [0.12, 0.7], [0.27, 0.3], [0.42, 0.7], [0.57, 0.3], [0.72, 0.7], [0.88, 0.3],
    ],
  },
  // Circle: start at top, sweep almost all the way round (leave a gap so the
  // last dot doesn't land on the first).
  { name: 'circle', emoji: '⭕', points: arcPts(0.5, 0.5, 0.34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.82, 11) },
  // Square: down the left, across the bottom, up the right, back across the top.
  {
    name: 'square', emoji: '⬜',
    points: joinPts(
      linePts(0.18, 0.18, 0.18, 0.82, 3),
      linePts(0.18, 0.82, 0.82, 0.82, 3),
      linePts(0.82, 0.82, 0.82, 0.18, 3),
      linePts(0.82, 0.18, 0.32, 0.18, 2),
    ),
  },
  // Triangle.
  {
    name: 'triangle', emoji: '🔺',
    points: joinPts(
      linePts(0.5, 0.16, 0.84, 0.8, 3),
      linePts(0.84, 0.8, 0.16, 0.8, 3),
      linePts(0.16, 0.8, 0.42, 0.32, 2),
    ),
  },
];

const PAD = 0.86; // fraction of the square region the shape fills (leaves a margin)

export default {
  id: 'trace',
  title: 'Trace Trails',
  emoji: '✏️',
  blurb: 'Slide along the dots!',
  tags: ['mouse', 'shapes'],

  mount(root, ctx) {
    injectStyles();

    root.innerHTML = `
      <div class="trace">
        <div class="trace-hud">✏️ Trace the <span id="trace-name">…</span>!</div>
        <div class="trace-stage" id="trace-stage">
          <svg class="trace-svg" id="trace-svg" preserveAspectRatio="none">
            <polyline class="trace-guide" id="trace-guide" points=""></polyline>
            <polyline class="trace-trail" id="trace-trail" points=""></polyline>
          </svg>
          <div class="trace-dots" id="trace-dots"></div>
        </div>
      </div>`;

    const stage = root.querySelector('#trace-stage');
    const svg = root.querySelector('#trace-svg');
    const guide = root.querySelector('#trace-guide');
    const trail = root.querySelector('#trace-trail');
    const dotsLayer = root.querySelector('#trace-dots');
    const nameEl = root.querySelector('#trace-name');

    // Rotate through shapes in a shuffled order so it feels fresh each run.
    const order = ctx.shuffle(SHAPES);
    let shapeIdx = 0;

    let dots = [];        // [{ el, nx, ny, cx, cy }] — cx/cy are px centers
    let next = 0;         // index of the next dot to reach
    let done = false;     // current shape finished, waiting to advance
    let radius = 40;      // hit radius in px (recomputed on layout)
    const timers = new Set();

    const later = (fn, ms) => {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    };

    /** Build the DOM for one shape and lay it out. */
    function loadShape(s) {
      next = 0;
      done = false;
      nameEl.textContent = s.name;
      trail.setAttribute('points', '');
      dotsLayer.innerHTML = '';

      dots = s.points.map((p, i) => {
        const el = document.createElement('div');
        el.className = 'trace-dot';
        el.textContent = String(i + 1);
        dotsLayer.appendChild(el);
        return { el, nx: p[0], ny: p[1], cx: 0, cy: 0 };
      });

      layout();
      dots[0].el.classList.add('is-next');
      ctx.speak(`Trace the ${s.name}`);
    }

    /** Recompute px positions from normalized coords (called on load + resize). */
    function layout() {
      const r = stage.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      // Center a square region inside the stage so shapes never distort.
      const side = Math.min(r.width, r.height) * PAD;
      const ox = (r.width - side) / 2;
      const oy = (r.height - side) / 2;
      radius = Math.max(34, side * 0.075);

      for (const d of dots) {
        d.cx = ox + d.nx * side;
        d.cy = oy + d.ny * side;
        d.el.style.transform = `translate(${d.cx}px, ${d.cy}px)`;
      }

      // SVG shares the stage's pixel coordinate space.
      svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      guide.setAttribute('points', dots.map((d) => `${d.cx},${d.cy}`).join(' '));
      // Redraw the trail through everything reached so far.
      trail.setAttribute('points', dots.slice(0, next).map((d) => `${d.cx},${d.cy}`).join(' '));
    }

    /** Pointer moved — if it's over the next dot, advance. */
    function onMove(e) {
      if (done || !dots.length) return;
      const r = stage.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const d = dots[next];
      if (Math.hypot(px - d.cx, py - d.cy) > radius) return;
      reach();
    }

    /** Mark the next dot as reached, grow the trail, play the rising note. */
    function reach() {
      const d = dots[next];
      d.el.classList.remove('is-next');
      d.el.classList.add('is-done');
      next += 1;

      trail.setAttribute('points', dots.slice(0, next).map((p) => `${p.cx},${p.cy}`).join(' '));
      ctx.audio.note(SCALE[(next - 1) % SCALE.length], { type: 'triangle', volume: 0.4, duration: 0.18 });

      if (next < dots.length) {
        dots[next].el.classList.add('is-next');
      } else {
        finish(d);
      }
    }

    /** Shape complete — celebrate, then bring on the next one. */
    function finish(lastDot) {
      done = true;
      ctx.confetti(lastDot.cx + stage.getBoundingClientRect().left,
                   lastDot.cy + stage.getBoundingClientRect().top);
      ctx.audio.cheer();
      ctx.speak(ctx.pick(PRAISE));
      later(() => {
        shapeIdx = (shapeIdx + 1) % order.length;
        loadShape(order[shapeIdx]);
      }, 1500);
    }

    stage.addEventListener('pointermove', onMove);
    const ro = new ResizeObserver(() => layout());
    ro.observe(stage);

    loadShape(order[shapeIdx]);

    // CRITICAL: drop listeners, the observer, and any pending timers on exit.
    return () => {
      stage.removeEventListener('pointermove', onMove);
      ro.disconnect();
      for (const id of timers) clearTimeout(id);
      timers.clear();
    };
  },
};

function injectStyles() {
  if (document.getElementById('trace-styles')) return;
  const css = document.createElement('style');
  css.id = 'trace-styles';
  css.textContent = `
    .trace { position:relative; height:100%; width:100%; overflow:hidden; }
    .trace-hud { position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:3;
      padding:8px 22px; border-radius:999px; background:var(--surface); box-shadow:var(--shadow);
      font-family:var(--font); font-size:clamp(1.1rem,3vw,1.6rem); font-weight:800; color:var(--text);
      pointer-events:none; white-space:nowrap; text-transform:capitalize; }
    .trace-stage { position:absolute; inset:0; }
    .trace-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
    .trace-guide { fill:none; stroke:var(--text-muted); stroke-opacity:0.35; stroke-width:6;
      stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:2 18; }
    .trace-trail { fill:none; stroke:var(--accent); stroke-width:14; stroke-linecap:round;
      stroke-linejoin:round; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.2)); }
    .trace-dots { position:absolute; inset:0; }
    .trace-dot { position:absolute; top:0; left:0; width:48px; height:48px; margin:-24px 0 0 -24px;
      border-radius:50%; display:grid; place-items:center; font-family:var(--font); font-weight:800;
      font-size:1.2rem; color:var(--text); background:var(--surface);
      box-shadow:var(--shadow); border:3px solid var(--text-muted);
      will-change:transform; transition:background .2s ease, border-color .2s ease, color .2s ease;
      pointer-events:none; }
    .trace-dot.is-next { border-color:var(--primary); color:var(--primary);
      animation:tracePulse 1s ease-in-out infinite; z-index:2; }
    .trace-dot.is-done { background:var(--accent); border-color:var(--accent); color:#fff; }
    @keyframes tracePulse {
      0%,100% { box-shadow:var(--shadow), 0 0 0 0 color-mix(in srgb, var(--primary) 55%, transparent); }
      50%     { box-shadow:var(--shadow), 0 0 0 14px color-mix(in srgb, var(--primary) 0%, transparent); }
    }
  `;
  document.head.appendChild(css);
}
