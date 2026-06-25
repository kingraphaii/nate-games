/**
 * themes/index.js — Theme registry.
 *
 * To add a theme: create a file in this folder that exports a theme object,
 * import it here, and add it to the array below. That's the whole job.
 *
 * A theme object looks like:
 *   {
 *     id: 'bat-racers',
 *     name: 'Bat Racers',
 *     emoji: '🦇',
 *     palette: {
 *       bg1, bg2,      // background gradient stops
 *       primary,       // main accent (buttons, highlights)
 *       accent,        // secondary accent
 *       surface,       // card background
 *       text,          // main text color
 *       textMuted,     // secondary text
 *     },
 *     background: {
 *       glyphs: ['🦇', '⚡'],   // emoji that drift across the home background
 *       density: 18,           // how many floaters
 *       speed: 0.4,            // drift speed multiplier
 *     },
 *   }
 *
 * NOTE: These are ORIGINAL themes *inspired by* the colours and moods of shows
 * kids like — no copyrighted logos or character art. Safe to host publicly.
 */
import batRacers from './bat-racers.js';
import bluePup from './blue-pup.js';
import webHero from './web-hero.js';
import nightHeroes from './night-heroes.js';
import rainbow from './rainbow.js';

export const THEMES = [rainbow, batRacers, bluePup, webHero, nightHeroes];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function randomTheme(excludeId) {
  const pool = excludeId ? THEMES.filter((t) => t.id !== excludeId) : THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}
