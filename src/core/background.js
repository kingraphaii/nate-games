/**
 * background.js — Whimsical animated home background.
 *
 * Paints the theme gradient onto a full-screen <canvas> and gently drifts the
 * theme's emoji "glyphs" across it. Lightweight: one requestAnimationFrame loop,
 * pauses when the tab is hidden, and respects prefers-reduced-motion.
 */
export class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.theme = null;
    this.raf = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._resize = this._resize.bind(this);
    this._loop = this._loop.bind(this);
    window.addEventListener('resize', this._resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._stop();
      else if (this.theme) this._start();
    });
    this._resize();
  }

  _resize() {
    const { canvas } = this;
    canvas.width = window.innerWidth * this.dpr;
    canvas.height = window.innerHeight * this.dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  setTheme(theme) {
    this.theme = theme;
    const { glyphs, density } = theme.background;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = this.reduceMotion ? Math.min(6, density) : density;
    this.particles = Array.from({ length: count }, () => this._spawn(glyphs, w, h, true));
    this._start();
  }

  _spawn(glyphs, w, h, anywhere) {
    const speed = (this.theme?.background.speed ?? 0.4) * (this.reduceMotion ? 0.3 : 1);
    return {
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 40,
      size: 22 + Math.random() * 36,
      vx: (Math.random() - 0.5) * 0.3 * speed * 60,
      vy: -(0.2 + Math.random() * 0.6) * speed * 60,
      drift: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.6,
      rot: Math.random() * Math.PI * 2,
      alpha: 0.5 + Math.random() * 0.4,
    };
  }

  _start() {
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this._loop);
    }
  }

  _stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  _loop(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const { ctx, theme } = this;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, theme.palette.bg1);
    grad.addColorStop(1, theme.palette.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (const p of this.particles) {
      p.drift += dt;
      p.rot += p.spin * dt;
      p.x += (p.vx + Math.sin(p.drift) * 8) * dt;
      p.y += p.vy * dt;
      if (p.y < -60) Object.assign(p, this._spawn(theme.background.glyphs, w, h, false));

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * 0.15);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.glyph, 0, 0);
      ctx.restore();
    }

    this.raf = requestAnimationFrame(this._loop);
  }
}
