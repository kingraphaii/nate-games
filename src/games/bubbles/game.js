/**
 * Bubble Pop — a gentle mouse-control trainer.
 *
 * Colorful, glossy bubbles drift up from the bottom, swaying side to side.
 * The player chases them with the pointer and clicks to pop: each pop bursts
 * confetti, plays a soft "pop" (smaller bubbles = higher pitch), and the
 * bubble puffs out and fades. A counter at the top keeps score, and every
 * tenth pop earns a cheer + spoken encouragement.
 *
 * Teaches: pointer tracking, aiming, and clicking — the basics of the mouse.
 * Built the same shape as the Animal Friends REFERENCE game.
 */

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
  blurb: 'Pop the floating bubbles!',
  tags: ['mouse', 'colors'],

  mount(root, ctx) {
    injectStyles();

    root.innerHTML = `
      <div class="bubbles">
        <div class="bubbles-hud">Popped: <span id="bub-count">0</span> 🫧</div>
        <div class="bubbles-layer" id="bub-layer"></div>
      </div>`;

    const layer = root.querySelector('#bub-layer');
    const countEl = root.querySelector('#bub-count');

    let popped = 0;
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

    /** Pop a bubble: sound, confetti, puff animation, then remove it. */
    function pop(b, e) {
      if (b.popping) return;
      b.popping = true;

      // Smaller bubbles squeak higher; bigger ones plop lower.
      const t = (b.size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE); // 0 (small) .. 1 (big)
      const pitch = 1.7 - t * 0.9; // ~1.7 for tiny, ~0.8 for big
      ctx.audio.pop({ pitch });
      ctx.confetti(e.clientX, e.clientY);

      // Quick scale-up + fade in place, then take it out of the world.
      // Stop the RAF loop from touching it and keep its current position
      // while adding scale, so it puffs where it sits instead of jumping.
      bubbles.delete(b);
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(1.45)`;
      b.el.classList.add('is-popped');
      setTimeout(() => b.el.remove(), 220);

      popped += 1;
      countEl.textContent = String(popped);
      countEl.parentElement.classList.remove('bump');
      void countEl.parentElement.offsetWidth; // restart the bump animation
      countEl.parentElement.classList.add('bump');

      // Celebrate every ten pops — but speak sparingly so it stays special.
      if (popped % 10 === 0) {
        ctx.audio.cheer();
        ctx.speak(`${popped} bubbles! Wow!`);
      }
    }

    /** Per-frame loop: rise, sway, and retire bubbles that float off the top. */
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
