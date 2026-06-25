/**
 * Bubble Pop — a gentle mouse-control trainer, now with combos.
 *
 * Colorful, glossy bubbles drift up from the bottom, swaying side to side.
 * The player chases them with the pointer and clicks to pop. Pop quickly and
 * a combo builds: a multiplier climbs (×2 → ×5), confetti gets bigger, and a
 * "+N" floats up where you popped. Let the streak lapse and it gently resets.
 *
 * Teaches: pointer tracking, aiming, clicking — and the joy of a hot streak.
 * Shares its "game feel" (combo/multiplier/floats) with Balloon Bash via
 * ../../core/juice.js.
 */
import { Combo, COMBO_COLORS, floatText, pulse, injectJuiceStyles } from '../../core/juice.js';

// Bright, cheerful bubble tints. Each gets a glossy radial gradient at runtime.
const COLORS = [
  '#ff6b9d', '#ff9f43', '#feca57', '#48dbfb',
  '#54a0ff', '#5f27cd', '#1dd1a1', '#ff6348',
];

// Tuning knobs — kept here so the gameplay is easy to read and tweak.
const SPAWN_MS = 700;       // how often a new bubble appears
const MAX_BUBBLES = 12;     // cap on concurrent bubbles (keeps it calm)
const MIN_SIZE = 70;        // smallest bubble diameter (px)
const MAX_SIZE = 130;       // largest bubble diameter (px)
const RISE_MIN = 18;        // slowest rise speed (px per second)
const RISE_MAX = 40;        // fastest rise speed (px per second)

export default {
  id: 'bubbles',
  title: 'Bubble Pop',
  emoji: '🫧',
  blurb: 'Pop fast to build a combo!',
  tags: ['mouse', 'colors'],

  mount(root, ctx) {
    injectStyles();
    injectJuiceStyles();

    root.innerHTML = `
      <div class="bubbles">
        <div class="bubbles-hud">
          <span>Popped: <span id="bub-count">0</span> 🫧</span>
          <span class="juice-combo" id="bub-combo">
            <span id="bub-combo-label">×2</span>
            <span class="meter"><i id="bub-combo-bar"></i></span>
          </span>
        </div>
        <div class="bubbles-layer" id="bub-layer"></div>
      </div>`;

    const stage = root.querySelector('.bubbles');
    const layer = root.querySelector('#bub-layer');
    const countEl = root.querySelector('#bub-count');
    const hudEl = root.querySelector('.bubbles-hud');
    const comboEl = root.querySelector('#bub-combo');
    const comboLabel = root.querySelector('#bub-combo-label');
    const comboBar = root.querySelector('#bub-combo-bar');

    let popped = 0;
    const combo = new Combo();
    // Live bubbles: each entry tracks its DOM node and motion state.
    const bubbles = new Set();
    let rafId = null;
    let lastTime = 0;

    /** Make one bubble, position it just below the play area, and let it rise. */
    function spawn() {
      if (bubbles.size >= MAX_BUBBLES) return;
      const rect = layer.getBoundingClientRect();
      if (rect.width === 0) return; // not laid out yet

      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      const color = ctx.pick(COLORS);
      const el = document.createElement('button');
      el.className = 'bubble';
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      // Glossy bubble: bright highlight off-center, fading to the tint.
      el.style.background = `radial-gradient(circle at 32% 28%,
        rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 14%,
        ${color} 55%, ${color} 100%)`;
      el.style.boxShadow = `inset 0 0 18px rgba(255,255,255,0.45), 0 6px 18px rgba(0,0,0,0.18)`;

      // Motion state.
      const b = {
        el,
        size,
        color,
        x: Math.random() * Math.max(1, rect.width - size), // left, in px
        y: rect.height,                                     // start below the floor
        vy: RISE_MIN + Math.random() * (RISE_MAX - RISE_MIN),
        swayAmp: 12 + Math.random() * 22,                   // horizontal sway range
        swayFreq: 0.6 + Math.random() * 0.9,                // sway speed
        phase: Math.random() * Math.PI * 2,                 // sway offset
        baseX: 0,
        popping: false,
      };
      b.baseX = b.x;
      el.style.transform = `translate(${b.x}px, ${b.y}px)`;

      el.addEventListener('pointerdown', (e) => pop(b, e));
      layer.appendChild(el);
      bubbles.add(b);
    }

    /** Pop a bubble: combo, sound, confetti, floating score, then remove it. */
    function pop(b, e) {
      if (b.popping) return;
      b.popping = true;

      // Smaller bubbles squeak higher; bigger ones plop lower.
      const t = (b.size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE); // 0 (small) .. 1 (big)
      const pitch = 1.7 - t * 0.9; // ~1.7 for tiny, ~0.8 for big

      // Combo + multiplier: quick consecutive pops earn more points.
      const { mult, streak, leveledUp } = combo.hit(performance.now());
      const gained = mult; // 1 point per pop, times the live multiplier
      popped += gained;

      ctx.audio.pop({ pitch: pitch * (1 + (mult - 1) * 0.12) });
      // Confetti scales with the multiplier and matches the bubble color.
      ctx.confetti(e.clientX, e.clientY, {
        count: 22 + mult * 10,
        colors: [b.color, '#ffffff', '#feca57', '#48dbfb'],
      });

      // Floating "+N" where it popped (layer-relative coords).
      const fx = b.x + b.size / 2;
      const fy = b.y + b.size / 2;
      floatText(layer, fx, fy, `+${gained}`, {
        color: COMBO_COLORS[mult],
        size: 0.9 + mult * 0.18,
        big: mult >= 3,
      });

      // Quick scale-up + fade in place, then take it out of the world.
      bubbles.delete(b);
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(1.45)`;
      b.el.classList.add('is-popped');
      setTimeout(() => b.el.remove(), 220);

      countEl.textContent = String(popped);
      pulse(hudEl, 'bump');
      updateCombo(mult, streak);

      // Reaching a fresh multiplier tier is a moment — shout it.
      if (leveledUp && mult >= 2) {
        ctx.audio.cheer();
        pulse(stage, 'juice-shake');
        pulse(comboEl, 'pop');
        floatText(layer, fx, fy - 36, `${mult}× COMBO!`, {
          color: COMBO_COLORS[mult], size: 1.1, big: true,
        });
        if (mult >= 4) ctx.speak(`${mult} times combo! Amazing!`);
      }
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

    /** Per-frame loop: rise, sway, retire stray bubbles, drain the combo meter. */
    function tick(now) {
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
      lastTime = now;

      for (const b of bubbles) {
        b.y -= b.vy * dt;
        b.phase += b.swayFreq * dt;
        b.x = b.baseX + Math.sin(b.phase) * b.swayAmp;
        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;

        // Gone above the top edge — quietly remove it (no pop).
        if (b.y < -b.size) {
          b.el.remove();
          bubbles.delete(b);
        }
      }

      // Drain the combo meter; hide the chip when the streak lapses.
      const ms = performance.now();
      comboBar.style.transform = `scaleX(${combo.fraction(ms).toFixed(3)})`;
      if (combo.expire(ms)) comboEl.classList.remove('is-on');

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    const spawnTimer = setInterval(spawn, SPAWN_MS);
    spawn(); // one bubble right away so the screen isn't empty

    // CRITICAL: stop the spawner, the RAF loop, and drop all nodes on exit.
    return () => {
      clearInterval(spawnTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      for (const b of bubbles) b.el.remove();
      bubbles.clear();
    };
  },
};

function injectStyles() {
  if (document.getElementById('bubbles-styles')) return;
  const css = document.createElement('style');
  css.id = 'bubbles-styles';
  css.textContent = `
    .bubbles { position:relative; height:100%; width:100%; overflow:hidden;
      background:linear-gradient(180deg, rgba(180,235,255,0.35), rgba(255,255,255,0.05)); }
    .bubbles-hud { position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:2;
      display:flex; align-items:center;
      padding:8px 20px; border-radius:999px; background:var(--surface); box-shadow:var(--shadow);
      font-family:var(--font); font-size:clamp(1.1rem,3vw,1.6rem); font-weight:800; color:var(--text);
      pointer-events:none; white-space:nowrap; }
    .bubbles-hud.bump { animation:bubBump .3s ease; }
    @keyframes bubBump { 0%,100%{transform:translateX(-50%) scale(1)} 40%{transform:translateX(-50%) scale(1.18)} }
    .bubbles-layer { position:absolute; inset:0; }
    .bubble { position:absolute; top:0; left:0; padding:0; border:none; border-radius:50%;
      cursor:pointer; will-change:transform; touch-action:none;
      transition:transform .22s ease, opacity .22s ease; }
    .bubble.is-popped { transform-origin:center; opacity:0; pointer-events:none; }
  `;
  document.head.appendChild(css);
}
