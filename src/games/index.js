/**
 * games/index.js — Game registry.
 *
 * To add a game:
 *   1. Create a folder `src/games/<your-id>/` with a `game.js` that
 *      `export default` a game object (see ../core/game-api.js for the shape).
 *   2. Import it here and add it to the GAMES array.
 * That's it — it appears on the home screen automatically.
 *
 * Order in this array = order on the home screen.
 */
import animals from './animals/game.js';
import bubbles from './bubbles/game.js';
import balloons from './balloons/game.js';
import fruit from './fruit/game.js';
import trace from './trace/game.js';
import match from './match/game.js';
import numbers from './numbers/game.js';
import letters from './letters/game.js';
import soundboard from './soundboard/game.js';

import { assertValidGame } from '../core/game-api.js';

export const GAMES = [animals, bubbles, balloons, fruit, trace, match, numbers, letters, soundboard].map(assertValidGame);

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}
