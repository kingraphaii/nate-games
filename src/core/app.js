/**
 * app.js — Application shell.
 *
 * Responsibilities:
 *   - Boot the animated background + confetti overlays.
 *   - Apply themes (CSS variables) and remember the last choice.
 *   - Render the home screen (theme switcher + game grid).
 *   - Mount/unmount games into the play area and build their GameContext.
 *
 * No router/framework — just show/hide screens and (de)serialize the current
 * game id into the URL hash so the back button and refresh behave sensibly.
 */
import { THEMES, getTheme, randomTheme } from '../themes/index.js';
import { GAMES, getGame } from '../games/index.js';
import { audio } from './audio.js';
import { Background } from './background.js';
import { Confetti } from './confetti.js';
import { EdgeScroller } from './edge-scroll.js';
import { makeActivatable } from './activatable.js';
import { shuffle, pick } from './game-api.js';

const STORAGE_KEY = 'nate-games:theme';
const SCROLL_KEY = 'nate-games:autoscroll';

class App {
  constructor() {
    this.bg = new Background(document.getElementById('bg-canvas'));
    this.confetti = new Confetti(document.getElementById('confetti-canvas'));
    this.home = document.getElementById('home');
    this.play = document.getElementById('play');
    this.playArea = document.getElementById('play-area');
    this.gameTitle = document.getElementById('game-title');
    this.themeBar = document.getElementById('theme-bar');
    this.grid = document.getElementById('game-grid');
    this.muteBtn = document.getElementById('mute-btn');
    this.scrollBtn = document.getElementById('scroll-btn');
    this.scroller = new EdgeScroller(this.grid);
    this.current = null; // active game module
    this.theme = null;

    this._initTheme();
    this._initAutoScroll();
    this._renderThemeBar();
    this._renderGrid();
    this._wireChrome();
    this._wireAudioUnlock();
    // Keep the "more below" fade in sync with scroll position.
    this.grid.addEventListener('scroll', () => this._updateScrollFade(), { passive: true });
    window.addEventListener('resize', () => this._updateScrollFade());
    window.addEventListener('hashchange', () => this._syncFromHash());
    this._syncFromHash();
  }

  // ---- Theme ---------------------------------------------------------------
  _initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.applyTheme(saved ? getTheme(saved) : randomTheme(), false);
  }

  applyTheme(theme, persist = true) {
    this.theme = theme;
    const p = theme.palette;
    const root = document.documentElement.style;
    root.setProperty('--bg1', p.bg1);
    root.setProperty('--bg2', p.bg2);
    root.setProperty('--primary', p.primary);
    root.setProperty('--accent', p.accent);
    root.setProperty('--surface', p.surface);
    root.setProperty('--text', p.text);
    root.setProperty('--text-muted', p.textMuted);
    this.bg.setTheme(theme);
    if (persist) localStorage.setItem(STORAGE_KEY, theme.id);
    // Update which swatch is active.
    this.themeBar?.querySelectorAll('.theme-chip').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.theme === theme.id);
    });
  }

  _renderThemeBar() {
    this.themeBar.innerHTML = '';
    // Surprise button — random theme.
    const surprise = document.createElement('button');
    surprise.className = 'theme-chip theme-chip--surprise';
    surprise.innerHTML = '<span class="chip-emoji">🎲</span><span class="chip-label">Surprise</span>';
    surprise.title = 'Surprise theme';
    surprise.addEventListener('click', () => {
      audio.unlock();
      audio.pop({ pitch: 1.2 });
      this.applyTheme(randomTheme(this.theme?.id));
    });
    this.themeBar.appendChild(surprise);

    for (const theme of THEMES) {
      const chip = document.createElement('button');
      chip.className = 'theme-chip';
      chip.dataset.theme = theme.id;
      chip.innerHTML = `<span class="chip-emoji">${theme.emoji}</span><span class="chip-label">${theme.name}</span>`;
      chip.title = theme.name;
      chip.addEventListener('click', () => {
        audio.unlock();
        audio.pop();
        this.applyTheme(theme);
      });
      this.themeBar.appendChild(chip);
    }
  }

  // ---- Auto-scroll (mouse-movement scrolling, toggle, default ON) ----------
  _initAutoScroll() {
    const saved = localStorage.getItem(SCROLL_KEY);
    // Default ON, but respect a system "reduce motion" preference on first run.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const on = saved == null ? !reduce : saved === '1';
    this._setAutoScroll(on, false);
  }

  _setAutoScroll(on, persist = true) {
    this.scroller.setEnabled(on);
    this.scrollBtn.setAttribute('aria-pressed', String(on));
    this.scrollBtn.classList.toggle('is-off', !on);
    this.scrollBtn.title = on ? 'Mouse-scroll: on' : 'Mouse-scroll: off';
    if (persist) localStorage.setItem(SCROLL_KEY, on ? '1' : '0');
  }

  // Show the soft bottom fade only while there's more list below the fold.
  _updateScrollFade() {
    const el = this.grid;
    const atEnd = el.scrollHeight <= el.clientHeight + 1
      || el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    el.classList.toggle('at-end', atEnd);
  }

  // ---- Home grid -----------------------------------------------------------
  _renderGrid() {
    this.grid.innerHTML = '';
    for (const game of GAMES) {
      const card = document.createElement('button');
      card.className = 'game-card';
      card.innerHTML = `
        <span class="game-emoji">${game.emoji}</span>
        <span class="game-name">${game.title}</span>
        <span class="game-blurb">${game.blurb || ''}</span>`;
      card.addEventListener('mouseenter', () => audio.unlock());
      card.addEventListener('click', () => {
        audio.unlock();
        audio.pop({ pitch: 1.1 });
        location.hash = `#/play/${game.id}`;
      });
      this.grid.appendChild(card);
    }
  }

  // ---- Navigation ----------------------------------------------------------
  _syncFromHash() {
    const m = location.hash.match(/^#\/play\/(.+)$/);
    if (m) {
      const game = getGame(m[1]);
      if (game) return this._openGame(game);
    }
    this._goHome();
  }

  _goHome() {
    this._closeGame();
    this.play.hidden = true;
    this.home.hidden = false;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    this._updateScrollFade();
    this.scroller.start(); // mouse-movement scrolling only runs on the home grid
  }

  _openGame(game) {
    if (this.current?.id === game.id) return;
    this._closeGame();
    this.scroller.stop();
    this.home.hidden = true;
    this.play.hidden = false;
    this.gameTitle.textContent = `${game.emoji} ${game.title}`;
    this.playArea.innerHTML = '';
    this.current = game;

    const ctx = {
      audio,
      speak: (text, opts) => audio.speak(text, opts),
      theme: this.theme,
      palette: this.theme.palette,
      exit: () => { location.hash = ''; },
      confetti: (x, y, opts) => this.confetti.burst(x, y, opts),
      activatable: (el, onActivate, opts) => makeActivatable(el, onActivate, opts),
      shuffle,
      pick,
    };
    const cleanup = game.mount(this.playArea, ctx);
    this._cleanup = typeof cleanup === 'function' ? cleanup : null;
  }

  _closeGame() {
    if (!this.current) return;
    try { this._cleanup?.(); } catch (e) { console.error(e); }
    try { this.current.unmount?.(); } catch (e) { console.error(e); }
    window.speechSynthesis?.cancel();
    this.playArea.innerHTML = '';
    this.current = null;
    this._cleanup = null;
  }

  // ---- Chrome (back, mute, audio unlock) -----------------------------------
  _wireChrome() {
    document.getElementById('back-btn').addEventListener('click', () => {
      audio.pop();
      location.hash = '';
    });
    this.muteBtn.addEventListener('click', () => {
      const muted = this.muteBtn.getAttribute('aria-pressed') !== 'true';
      this.muteBtn.setAttribute('aria-pressed', String(muted));
      this.muteBtn.textContent = muted ? '🔇' : '🔊';
      audio.setMuted(muted);
    });
    this.scrollBtn.addEventListener('click', () => {
      audio.unlock();
      audio.pop();
      const on = this.scrollBtn.getAttribute('aria-pressed') !== 'true';
      this._setAutoScroll(on);
    });
  }

  _wireAudioUnlock() {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
  }
}

window.addEventListener('DOMContentLoaded', () => new App());
