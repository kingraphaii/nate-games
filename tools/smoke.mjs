/**
 * smoke.mjs — dev-only smoke test. Run with: node tools/smoke.mjs
 *
 * Imports the game and theme registries, which executes every game and theme
 * module plus assertValidGame, then checks the invariants the registries must
 * hold: unique ids, game folders that match their ids, and complete theme
 * palettes. app.js and audio.js touch `window` at import time, so CI covers
 * them with the syntax check only.
 */
import { existsSync } from 'node:fs';

const errors = [];

const { GAMES } = await import(new URL('../src/games/index.js', import.meta.url));
const { THEMES } = await import(new URL('../src/themes/index.js', import.meta.url));

const gameIds = new Set();
for (const game of GAMES) {
  if (gameIds.has(game.id)) errors.push(`duplicate game id "${game.id}"`);
  gameIds.add(game.id);
  if (!existsSync(new URL(`../src/games/${game.id}/game.js`, import.meta.url))) {
    errors.push(`game id "${game.id}" does not match a folder src/games/${game.id}/`);
  }
  if (!game.blurb) errors.push(`game "${game.id}" is missing a blurb`);
}

const PALETTE_KEYS = ['bg1', 'bg2', 'primary', 'accent', 'surface', 'text', 'textMuted'];
const themeIds = new Set();
for (const theme of THEMES) {
  if (themeIds.has(theme.id)) errors.push(`duplicate theme id "${theme.id}"`);
  themeIds.add(theme.id);
  for (const key of PALETTE_KEYS) {
    if (!theme.palette?.[key]) errors.push(`theme "${theme.id}" palette is missing "${key}"`);
  }
  if (!Array.isArray(theme.background?.glyphs) || theme.background.glyphs.length === 0) {
    errors.push(`theme "${theme.id}" has no background glyphs`);
  }
}

if (errors.length > 0) {
  console.error(`smoke: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`smoke: OK — ${GAMES.length} games and ${THEMES.length} themes load cleanly`);
