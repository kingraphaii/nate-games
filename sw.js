/**
 * sw.js — Service worker for Little Games (PWA).
 *
 * Strategy:
 *   - Precache the full static shell on install so the app works offline and is
 *     installable. Every game/theme module is statically imported at boot, so the
 *     list below is the entire app — no lazy chunks to miss.
 *   - Serve with stale-while-revalidate: respond from cache instantly, then refresh
 *     the cache from the network in the background. Fast loads, eventual updates,
 *     full offline. Navigations fall back to the cached shell when offline.
 *
 * Paths are relative to this script's location, so the same worker works locally
 * and under the `/nate-games/` GitHub Pages base path. Bump CACHE to ship updates.
 */
const CACHE = 'little-games-v1';

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/maskable-512.png',
  'assets/apple-touch-icon.png',
  // Core shell
  'src/core/app.js',
  'src/core/audio.js',
  'src/core/background.js',
  'src/core/confetti.js',
  'src/core/edge-scroll.js',
  'src/core/activatable.js',
  'src/core/game-api.js',
  'src/core/juice.js',
  // Themes
  'src/themes/index.js',
  'src/themes/bat-racers.js',
  'src/themes/blue-pup.js',
  'src/themes/night-heroes.js',
  'src/themes/rainbow.js',
  'src/themes/web-hero.js',
  // Games
  'src/games/index.js',
  'src/games/animals/game.js',
  'src/games/balloons/game.js',
  'src/games/bubbles/game.js',
  'src/games/fruit/game.js',
  'src/games/letters/game.js',
  'src/games/match/game.js',
  'src/games/music/game.js',
  'src/games/numbers/game.js',
  'src/games/peekaboo/game.js',
  'src/games/trace/game.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // ignore cross-origin
  event.respondWith(staleWhileRevalidate(req));
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  // Cache first for speed/offline; fall back to network, then to the app shell.
  return cached || (await network) || (await cache.match('index.html'));
}
