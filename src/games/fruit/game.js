/**
 * Fruit Slice — a toddler-friendly Fruit Ninja. Nate likes fruit. 🍉
 *
 * Big, juicy fruits arc up from the bottom in slow, gentle tosses. Just *move*
 * the pointer through them to slice — no click or button-hold needed, since
 * little ones aren't reliable with an external mouse yet. Each fruit splits into two
 * halves that tumble away, juice splatters in its color, and a "+N" floats up.
 * Slicing several fruits in one swipe — or in quick succession — builds the
 * shared combo multiplier (×2 → ×5). Now and then a sparkly rainbow fruit
 * drifts by, worth a big bonus.
 *
 * Toddler-friendly on purpose: no bombs, no timer, no way to lose. Missed
 * fruit simply falls back down. It rewards aiming, swiping, and chasing a
 * streak — the same "game feel" as Bubble Pop / Balloon Bash (../../core/juice.js).
 */
import { Combo, COMBO_COLORS, floatText, pulse, injectJuiceStyles } from '../../core/juice.js';

// Each fruit: the emoji to show and the juice color it splatters.
const FRUITS = [
  { emoji: '🍉', color: '#ff5e7e' },
  { emoji: '🍊', color: '#ff9f43' },
  { emoji: '🍋', color: '#feca57' },
  { emoji: '🍎', color: '#ee5253' },
  { emoji: '🍓', color: '#ff6b81' },
  { emoji: '🍇', color: '#a55eea' },
  { emoji: '🥝', color: '#26de81' },
  { emoji: '🍑', color: '#ff7f50' },
  { emoji: '🍍', color: '#f9ca24' },
  { emoji: '🫐', color: '#5f6fd0' },
];

// Tuning knobs.
const SPAWN_MS = 950;       // base time between tosses
const MAX_FRUIT = 9;        // cap on concurrent fruit (keeps it calm)
const MIN_SIZE = 76;        // smallest fruit (px)
const MAX_SIZE = 118;       // largest fruit (px)
const GRAVITY = 440;        // px per second^2 — gentle, toddler-paced arcs
const LAUNCH_MIN = 520;     // slowest upward toss speed (px/s)
const LAUNCH_MAX = 650;     // fastest upward toss speed (px/s)
const CLUSTER_CHANCE = 0.4; // chance a toss throws an extra fruit or two
const SPECIAL_CHANCE = 0.09;// chance a fruit is a rainbow bonus fruit
const SPECIAL_BONUS = 5;    // extra points a rainbow fruit awards
const TRAIL_MS = 150;       // how long blade-trail points live

export default {
  id: 'fruit',
  title: 'Fruit Slice',
  emoji: '🍉',
  blurb: 'Wave the mouse to slice the fruit!',
  tags: ['mouse', 'fruit'],

  mount(root, ctx) {
    injectStyles();
    injectJuiceStyles();

    root.innerHTML = `
      <div class="fruit">
        <div class="fruit-hud">
          <span>Sliced: <span id="fr-count">0</span> 🍉</span>
          <span class="juice-combo" id="fr-combo">
            <span id="fr-combo-label">×2</span>
            <span class="meter"><i id="fr-combo-bar"></i></span>
          </span>
        </div>
        <div class="fruit-layer" id="fr-layer">
          <canvas class="fruit-blade" id="fr-blade"></canvas>
        </div>
      </div>`;

    const stage = root.querySelector('.fruit');
    const layer = root.querySelector('#fr-layer');
    const canvas = root.querySelector('#fr-blade');
    const bctx = canvas.getContext('2d');
    const countEl = root.querySelector('#fr-count');
    const hudEl = root.querySelector('.fruit-hud');
    const comboEl = root.querySelector('#fr-combo');
    const comboLabel = root.querySelector('#fr-combo-label');
    const comboBar = root.querySelector('#fr-combo-bar');

    let sliced = 0;
    const combo = new Combo();
    const fruits = new Set();
    let rafId = null;
    let lastTime = 0;

    // Blade-trail state: recent pointer points (layer-relative). The blade is
    // ALWAYS live — moving the pointer slices, no click/hold required.
    let trail = [];        // [{ x, y, t }]
    let prevPt = null;     // last point, for segment-vs-fruit hit tests
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeCanvas() {
      const r = layer.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    /** Toss one fruit up from near the bottom with a gentle arc. */
    function spawnOne() {
      if (fruits.size >= MAX_FRUIT) return;
      const rect = layer.getBoundingClientRect();
      if (rect.width === 0) return;

      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      const special = Math.random() < SPECIAL_CHANCE;
      const def = ctx.pick(FRUITS);

      const el = document.createElement('div');
      el.className = 'fruit-item' + (special ? ' is-special' : '');
      el.textContent = special ? '🌈' : def.emoji;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.fontSize = `${size * 0.92}px`;

      // Launch from a random spot along the bottom, biased toward the middle.
      const margin = size;
      const x = margin + Math.random() * Math.max(1, rect.width - margin * 2);
      const f = {
        el,
        def,
        special,
        size,
        color: special ? '#ff6bd6' : def.color,
        x,
        y: rect.height,
        vx: (Math.random() - 0.5) * 180,
        vy: -(LAUNCH_MIN + Math.random() * (LAUNCH_MAX - LAUNCH_MIN)),
        rot: 0,
        spin: (Math.random() - 0.5) * 160, // deg/sec
        sliced: false,
      };
      el.style.transform = `translate(${f.x}px, ${f.y}px)`;
      layer.appendChild(el);
      fruits.add(f);
    }

    /** A toss: usually one fruit, sometimes a little cluster for combos. */
    function toss() {
      spawnOne();
      if (Math.random() < CLUSTER_CHANCE) {
        const extra = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < extra; i++) setTimeout(spawnOne, 120 * (i + 1));
      }
    }

    /** Slice a fruit: combo, swoosh, splatter, split into halves, score. */
    function slice(f) {
      if (f.sliced) return;
      f.sliced = true;
      fruits.delete(f);

      const cx = f.x + f.size / 2;
      const cy = f.y + f.size / 2;

      const { mult, streak, leveledUp } = combo.hit(performance.now());
      let gained = mult;
      if (f.special) gained += SPECIAL_BONUS;
      sliced += gained;

      ctx.audio.swoosh({ pitch: 1.4 - (f.size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE) * 0.5 });
      // Juice splatter — confetti at the fruit, in its color.
      const screenX = layer.getBoundingClientRect().left + cx;
      const screenY = layer.getBoundingClientRect().top + cy;
      ctx.confetti(screenX, screenY, {
        count: (f.special ? 46 : 24) + mult * 9,
        colors: f.special
          ? ['#ff6bd6', '#ffd000', '#48dbfb', '#1dd1a1', '#ffffff']
          : [f.color, '#ffffff', tint(f.color)],
      });

      splitInHalves(f);

      floatText(layer, cx, cy, `+${gained}`, {
        color: f.special ? '#ff6bd6' : COMBO_COLORS[mult],
        size: 0.95 + mult * 0.18 + (f.special ? 0.3 : 0),
        big: mult >= 3 || f.special,
      });

      countEl.textContent = String(sliced);
      pulse(hudEl, 'bump');
      updateCombo(mult, streak);

      if (f.special) {
        ctx.audio.cheer();
        pulse(stage, 'juice-shake');
        floatText(layer, cx, cy - 38, 'RAINBOW! 🌈', { color: '#ff6bd6', size: 1.15, big: true });
        ctx.speak('Rainbow fruit! Yummy bonus!');
      } else if (leveledUp && mult >= 2) {
        ctx.audio.cheer();
        pulse(stage, 'juice-shake');
        pulse(comboEl, 'pop');
        floatText(layer, cx, cy - 36, `${mult}× COMBO!`, { color: COMBO_COLORS[mult], size: 1.1, big: true });
        if (mult >= 4) ctx.speak(`${mult} times combo! Super slicer!`);
      }
    }

    /** Replace a fruit with two halves that tumble apart and fall away. */
    function splitInHalves(f) {
      const emoji = f.special ? '🌈' : f.def.emoji;
      for (const side of ['left', 'right']) {
        const h = document.createElement('div');
        h.className = `fruit-half ${side}`;
        h.textContent = emoji;
        h.style.width = `${f.size}px`;
        h.style.height = `${f.size}px`;
        h.style.fontSize = `${f.size * 0.92}px`;
        h.style.transform = `translate(${f.x}px, ${f.y}px) rotate(${f.rot}deg)`;
        layer.appendChild(h);
        // Next frame: fling each half outward + down, then fade and remove.
        const dir = side === 'left' ? -1 : 1;
        requestAnimationFrame(() => {
          h.style.transform =
            `translate(${f.x + dir * 55}px, ${f.y + 90}px) rotate(${f.rot + dir * 60}deg)`;
          h.style.opacity = '0';
        });
        setTimeout(() => h.remove(), 640);
      }
      f.el.remove();
    }

    /** Show/refresh the combo chip for the current multiplier. */
    function updateCombo(mult, streak) {
      if (mult >= 2) {
        comboLabel.textContent = `×${mult}`;
        comboEl.classList.add('is-on');
        comboEl.style.setProperty('--streak', String(streak));
      } else {
        comboEl.classList.remove('is-on');
      }
    }

    // ---- Pointer (blade) handling -------------------------------------------
    function localPoint(e) {
      const r = layer.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    /** Slice any un-sliced fruit the segment a->b passes through. */
    function hitTest(a, b) {
      for (const f of fruits) {
        const cx = f.x + f.size / 2;
        const cy = f.y + f.size / 2;
        const rad = f.size * 0.55; // forgiving hit radius for little hands
        if (distToSegment(cx, cy, a.x, a.y, b.x, b.y) <= rad) slice(f);
      }
    }

    // Any pointer contact (tap/click) slices what's under it — but it's optional.
    function onDown(e) {
      const p = localPoint(e);
      prevPt = p;
      trail = [{ x: p.x, y: p.y, t: performance.now() }];
      hitTest(p, p);
    }
    // Hover-slice: just moving the pointer drags the blade through the fruit.
    function onMove(e) {
      const p = localPoint(e);
      trail.push({ x: p.x, y: p.y, t: performance.now() });
      if (prevPt) hitTest(prevPt, p);
      else hitTest(p, p);
      prevPt = p;
    }
    // Pointer left the play area — break the blade so we don't draw/slice across
    // the gap when it returns.
    function onLeave() {
      prevPt = null;
    }

    layer.addEventListener('pointerdown', onDown);
    layer.addEventListener('pointermove', onMove);
    layer.addEventListener('pointerleave', onLeave);
    layer.style.touchAction = 'none';

    /** Draw the fading blade trail from the recent pointer points. */
    function drawBlade(now) {
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, canvas.width, canvas.height);
      trail = trail.filter((p) => now - p.t < TRAIL_MS);
      if (trail.length < 2) return;
      bctx.lineCap = 'round';
      bctx.lineJoin = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const age = (now - b.t) / TRAIL_MS;      // 0 (fresh) .. 1 (old)
        const k = 1 - age;
        bctx.strokeStyle = `rgba(255,255,255,${0.85 * k})`;
        bctx.lineWidth = 2 + 12 * k;             // tapers toward the tail
        bctx.beginPath();
        bctx.moveTo(a.x, a.y);
        bctx.lineTo(b.x, b.y);
        bctx.stroke();
      }
    }

    /** Per-frame loop: fly fruit along their arcs, draw blade, drain combo. */
    function tick(now) {
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
      lastTime = now;
      const rect = layer.getBoundingClientRect();

      for (const f of fruits) {
        f.vy += GRAVITY * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.rot += f.spin * dt;
        f.el.style.transform = `translate(${f.x}px, ${f.y}px) rotate(${f.rot}deg)`;
        // Fell back below the floor — quietly retire it (no penalty).
        if (f.y > rect.height + f.size) {
          f.el.remove();
          fruits.delete(f);
        }
      }

      drawBlade(now);

      const ms = performance.now();
      comboBar.style.transform = `scaleX(${combo.fraction(ms).toFixed(3)})`;
      if (combo.expire(ms)) comboEl.classList.remove('is-on');

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    const spawnTimer = setInterval(toss, SPAWN_MS);
    toss();

    // CRITICAL: stop timers/RAF, drop listeners, and remove all nodes on exit.
    return () => {
      clearInterval(spawnTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener('resize', sizeCanvas);
      for (const f of fruits) f.el.remove();
      fruits.clear();
    };
  },
};

/** Distance from point (px,py) to segment (x1,y1)-(x2,y2). */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** A lighter wash of a hex color, for two-tone juice splatter. */
function tint(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 70);
  const g = Math.min(255, ((n >> 8) & 255) + 70);
  const b = Math.min(255, (n & 255) + 70);
  return `rgb(${r},${g},${b})`;
}

function injectStyles() {
  if (document.getElementById('fruit-styles')) return;
  const css = document.createElement('style');
  css.id = 'fruit-styles';
  css.textContent = `
    .fruit { position:relative; height:100%; width:100%; overflow:hidden;
      background:linear-gradient(180deg, rgba(186,242,210,0.4), rgba(255,247,214,0.12)); }
    .fruit-hud { position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:3;
      display:flex; align-items:center;
      padding:8px 20px; border-radius:999px; background:var(--surface); box-shadow:var(--shadow);
      font-family:var(--font); font-size:clamp(1.1rem,3vw,1.6rem); font-weight:800; color:var(--text);
      pointer-events:none; white-space:nowrap; }
    .fruit-hud.bump { animation:frBump .3s ease; }
    @keyframes frBump { 0%,100%{transform:translateX(-50%) scale(1)} 40%{transform:translateX(-50%) scale(1.18)} }
    .fruit-layer { position:absolute; inset:0; touch-action:none; }
    .fruit-blade { position:absolute; inset:0; z-index:4; pointer-events:none; }
    .fruit-item { position:absolute; top:0; left:0; display:flex; align-items:center; justify-content:center;
      line-height:1; user-select:none; cursor:crosshair; will-change:transform; z-index:2;
      filter:drop-shadow(0 6px 8px rgba(0,0,0,0.25)); }
    .fruit-item.is-special { animation:frShimmer 1.3s ease-in-out infinite;
      filter:drop-shadow(0 0 10px rgba(255,107,214,0.8)) drop-shadow(0 6px 8px rgba(0,0,0,0.25)); }
    @keyframes frShimmer { 0%,100%{filter:drop-shadow(0 0 8px rgba(255,107,214,0.7)) drop-shadow(0 6px 8px rgba(0,0,0,0.25))}
      50%{filter:drop-shadow(0 0 16px rgba(120,200,255,0.95)) drop-shadow(0 6px 8px rgba(0,0,0,0.25))} }
    .fruit-half { position:absolute; top:0; left:0; display:flex; align-items:center; justify-content:center;
      line-height:1; user-select:none; pointer-events:none; z-index:3; will-change:transform,opacity;
      transition:transform .6s cubic-bezier(.2,.6,.4,1), opacity .6s ease-out;
      filter:drop-shadow(0 6px 8px rgba(0,0,0,0.25)); }
    .fruit-half.left  { clip-path:inset(0 50% 0 0); }
    .fruit-half.right { clip-path:inset(0 0 0 50%); }
  `;
  document.head.appendChild(css);
}
