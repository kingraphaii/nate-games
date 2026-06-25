/**
 * Balloon Bash — Bubble Pop's bouncier cousin, because Nate loves balloons. 🎈
 *
 * Bright, glossy balloons (with a little knot and a wiggling string) float up
 * from the bottom, swaying as they climb. Click to BANG them: a sharp pop, a
 * confetti burst, and a "+N" floats up. Popping quickly builds the same combo
 * multiplier as Bubble Pop (×2 → ×5). Every so often a shimmering GOLDEN
 * balloon drifts by — bash it for a big bonus and a cheer.
 *
 * Teaches: pointer tracking, aiming, clicking, and chasing a hot streak.
 * Shares its "game feel" with Bubble Pop via ../../core/juice.js.
 */
import { Combo, COMBO_COLORS, floatText, pulse, injectJuiceStyles } from '../../core/juice.js';

// Opaque, candy-bright balloon colors (paired light/dark for a glossy sheen).
const COLORS = [
  { light: '#ff8fab', dark: '#e63462' }, // pink
  { light: '#7ee8fa', dark: '#1a73a8' }, // sky
  { light: '#ffd36e', dark: '#f59f00' }, // gold-ish
  { light: '#9b8cff', dark: '#5f27cd' }, // purple
  { light: '#7bed9f', dark: '#10ac84' }, // mint
  { light: '#ff9f7a', dark: '#e8590c' }, // orange
  { light: '#74b9ff', dark: '#0652dd' }, // blue
];

// Tuning knobs.
const SPAWN_MS = 760;       // how often a new balloon appears
const MAX_BALLOONS = 11;    // cap on concurrent balloons
const MIN_SIZE = 64;        // smallest balloon width (px)
const MAX_SIZE = 116;       // largest balloon width (px)
const RISE_MIN = 20;        // slowest rise speed (px per second)
const RISE_MAX = 44;        // fastest rise speed (px per second)
const GOLDEN_CHANCE = 0.08; // chance a spawn is a bonus golden balloon
const GOLDEN_BONUS = 5;     // extra points a golden balloon awards

export default {
  id: 'balloons',
  title: 'Balloon Bash',
  emoji: '🎈',
  blurb: 'Bash balloons, chase golden ones!',
  tags: ['mouse', 'colors'],

  mount(root, ctx) {
    injectStyles();
    injectJuiceStyles();

    root.innerHTML = `
      <div class="balloons">
        <div class="balloons-hud">
          <span>Popped: <span id="bal-count">0</span> 🎈</span>
          <span class="juice-combo" id="bal-combo">
            <span id="bal-combo-label">×2</span>
            <span class="meter"><i id="bal-combo-bar"></i></span>
          </span>
        </div>
        <div class="balloons-layer" id="bal-layer"></div>
      </div>`;

    const stage = root.querySelector('.balloons');
    const layer = root.querySelector('#bal-layer');
    const countEl = root.querySelector('#bal-count');
    const hudEl = root.querySelector('.balloons-hud');
    const comboEl = root.querySelector('#bal-combo');
    const comboLabel = root.querySelector('#bal-combo-label');
    const comboBar = root.querySelector('#bal-combo-bar');

    let popped = 0;
    const combo = new Combo();
    const balloons = new Set();
    let rafId = null;
    let lastTime = 0;

    /** Make one balloon below the play area and let it rise. */
    function spawn() {
      if (balloons.size >= MAX_BALLOONS) return;
      const rect = layer.getBoundingClientRect();
      if (rect.width === 0) return;

      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      const golden = Math.random() < GOLDEN_CHANCE;
      const c = golden ? null : ctx.pick(COLORS);

      const el = document.createElement('button');
      el.className = 'balloon' + (golden ? ' is-golden' : '');
      el.style.width = `${size}px`;
      el.style.height = `${size * 1.22}px`; // balloons are a touch taller than wide
      if (golden) {
        el.style.background = `radial-gradient(circle at 34% 26%,
          #fff3c4 0%, #ffe066 30%, #ffd000 60%, #f0a500 100%)`;
        el.style.boxShadow = `inset 0 0 22px rgba(255,255,255,0.6),
          0 0 24px rgba(255,208,0,0.6), 0 8px 20px rgba(0,0,0,0.22)`;
      } else {
        el.style.background = `radial-gradient(circle at 34% 26%,
          rgba(255,255,255,0.9) 0%, ${c.light} 26%, ${c.dark} 100%)`;
        el.style.boxShadow = `inset -6px -8px 16px rgba(0,0,0,0.18),
          inset 6px 6px 14px rgba(255,255,255,0.35), 0 8px 20px rgba(0,0,0,0.2)`;
      }
      // The string hangs from the knot and wiggles as the balloon sways.
      el.innerHTML = `<span class="balloon-string"></span>`;

      const b = {
        el,
        size,
        golden,
        color: golden ? '#ffd000' : c.dark,
        x: Math.random() * Math.max(1, rect.width - size),
        y: rect.height,
        vy: RISE_MIN + Math.random() * (RISE_MAX - RISE_MIN),
        swayAmp: 14 + Math.random() * 24,
        swayFreq: 0.5 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        baseX: 0,
        popping: false,
      };
      b.baseX = b.x;
      el.style.transform = `translate(${b.x}px, ${b.y}px)`;

      el.addEventListener('pointerdown', (e) => pop(b, e));
      layer.appendChild(el);
      balloons.add(b);
    }

    /** Bash a balloon: combo, bang, confetti, floating score, then remove it. */
    function pop(b, e) {
      if (b.popping) return;
      b.popping = true;

      // Bigger balloons bang lower and fatter.
      const t = (b.size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE);
      const pitch = 1.5 - t * 0.7;

      const { mult, streak, leveledUp } = combo.hit(performance.now());
      let gained = mult;
      if (b.golden) gained += GOLDEN_BONUS; // bonus on top of the multiplier
      popped += gained;

      ctx.audio.burst({ pitch, volume: b.golden ? 0.6 : 0.5 });
      ctx.confetti(e.clientX, e.clientY, {
        count: (b.golden ? 48 : 24) + mult * 10,
        colors: b.golden
          ? ['#ffd000', '#fff3c4', '#ffe066', '#f0a500', '#ffffff']
          : [b.color, '#ffffff', COLORS[0].light, COLORS[2].light],
      });

      const fx = b.x + b.size / 2;
      const fy = b.y + b.size * 0.5;
      floatText(layer, fx, fy, `+${gained}`, {
        color: b.golden ? '#ffd000' : COMBO_COLORS[mult],
        size: 0.95 + mult * 0.18 + (b.golden ? 0.3 : 0),
        big: mult >= 3 || b.golden,
      });

      balloons.delete(b);
      b.el.classList.add('is-popped');
      setTimeout(() => b.el.remove(), 200);

      countEl.textContent = String(popped);
      pulse(hudEl, 'bump');
      updateCombo(mult, streak);

      if (b.golden) {
        ctx.audio.cheer();
        pulse(stage, 'juice-shake');
        floatText(layer, fx, fy - 38, 'GOLDEN! ✨', { color: '#ffd000', size: 1.15, big: true });
        ctx.speak('Golden balloon! Bonus!');
      } else if (leveledUp && mult >= 2) {
        ctx.audio.cheer();
        pulse(stage, 'juice-shake');
        pulse(comboEl, 'pop');
        floatText(layer, fx, fy - 36, `${mult}× COMBO!`, {
          color: COMBO_COLORS[mult], size: 1.1, big: true,
        });
        if (mult >= 4) ctx.speak(`${mult} times combo! Wow!`);
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

    /** Per-frame loop: rise, sway, retire stray balloons, drain the combo meter. */
    function tick(now) {
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
      lastTime = now;

      for (const b of balloons) {
        b.y -= b.vy * dt;
        b.phase += b.swayFreq * dt;
        b.x = b.baseX + Math.sin(b.phase) * b.swayAmp;
        // A little tilt in the sway direction sells the floaty feel.
        const tilt = Math.cos(b.phase) * 6;
        b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${tilt}deg)`;

        if (b.y < -b.size * 1.5) {
          b.el.remove();
          balloons.delete(b);
        }
      }

      const ms = performance.now();
      comboBar.style.transform = `scaleX(${combo.fraction(ms).toFixed(3)})`;
      if (combo.expire(ms)) comboEl.classList.remove('is-on');

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    const spawnTimer = setInterval(spawn, SPAWN_MS);
    spawn();

    // CRITICAL: stop everything and drop all nodes on exit.
    return () => {
      clearInterval(spawnTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      for (const b of balloons) b.el.remove();
      balloons.clear();
    };
  },
};

function injectStyles() {
  if (document.getElementById('balloons-styles')) return;
  const css = document.createElement('style');
  css.id = 'balloons-styles';
  css.textContent = `
    .balloons { position:relative; height:100%; width:100%; overflow:hidden;
      background:linear-gradient(180deg, rgba(255,225,240,0.4), rgba(220,240,255,0.08)); }
    .balloons-hud { position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:2;
      display:flex; align-items:center;
      padding:8px 20px; border-radius:999px; background:var(--surface); box-shadow:var(--shadow);
      font-family:var(--font); font-size:clamp(1.1rem,3vw,1.6rem); font-weight:800; color:var(--text);
      pointer-events:none; white-space:nowrap; }
    .balloons-hud.bump { animation:balBump .3s ease; }
    @keyframes balBump { 0%,100%{transform:translateX(-50%) scale(1)} 40%{transform:translateX(-50%) scale(1.18)} }
    .balloons-layer { position:absolute; inset:0; }
    /* Balloon: rounded top, gently pinched bottom, with a knot drawn below. */
    .balloon { position:absolute; top:0; left:0; padding:0; border:none; cursor:pointer;
      will-change:transform; touch-action:none; transform-origin:center 60%;
      border-radius:50% 50% 50% 50% / 55% 55% 46% 46%;
      transition:transform .2s ease, opacity .2s ease; }
    /* The knot: a little triangle poking out the bottom. */
    .balloon::after { content:''; position:absolute; left:50%; bottom:-7px; transform:translateX(-50%);
      width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent;
      border-top:9px solid rgba(0,0,0,0.18); }
    .balloon.is-golden::after { border-top-color:#f0a500; }
    /* The string: a thin line hanging from the knot, swaying with a curve. */
    .balloon-string { position:absolute; left:50%; top:100%; width:2px; height:46px;
      transform:translateX(-50%); border-radius:2px;
      background:linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.05));
      pointer-events:none; transform-origin:top center; animation:balString 2.2s ease-in-out infinite; }
    @keyframes balString { 0%,100%{transform:translateX(-50%) rotate(-7deg)} 50%{transform:translateX(-50%) rotate(7deg)} }
    .balloon.is-golden { animation:balShimmer 1.6s ease-in-out infinite; }
    @keyframes balShimmer { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.25)} }
    .balloon.is-popped { transform-origin:center; opacity:0; transform:scale(1.5) rotate(8deg); pointer-events:none; }
    .balloon.is-popped .balloon-string { opacity:0; }
  `;
  document.head.appendChild(css);
}
