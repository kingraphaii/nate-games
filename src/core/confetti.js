/**
 * confetti.js — Tiny celebratory particle burst on its own overlay canvas.
 * Used for rewards (correct answers, popped bubbles). Asset-free.
 */
export class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.raf = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._loop = this._loop.bind(this);
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  _resize() {
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
  }

  /** Burst `count` particles outward from screen point (x, y). */
  burst(x, y, { count = 28, colors = ['#ff7a59', '#ffd166', '#06d6a0', '#118ab2', '#ef476f'] } = {}) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 120 + Math.random() * 220;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 12,
      });
    }
    this._start();
  }

  _start() {
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this._loop);
    }
  }

  _loop(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.vy += 520 * dt; // gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      p.life -= dt * 0.9;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (this.particles.length) {
      this.raf = requestAnimationFrame(this._loop);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      this.raf = null;
    }
  }
}
