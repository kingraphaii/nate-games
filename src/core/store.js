/**
 * store.js — Tiny persistent key/value store on top of localStorage.
 *
 * Values are JSON-encoded under a `nate-games:` prefix (same convention as the
 * theme and autoscroll keys). Every localStorage access is wrapped in try/catch
 * with an in-memory Map fallback, so private browsing or a storage-denied
 * standalone PWA degrades to session-only persistence instead of throwing.
 */

const PREFIX = 'nate-games:';
const memory = new Map(); // session fallback when localStorage is unavailable

/** Read a stored value; returns `fallback` when absent or unreadable. */
export function load(key, fallback = null) {
  const k = PREFIX + key;
  try {
    const raw = localStorage.getItem(k);
    if (raw != null) return JSON.parse(raw);
  } catch { /* storage denied or corrupt JSON — fall through */ }
  return memory.has(k) ? memory.get(k) : fallback;
}

/** Store a value (JSON-serializable). Best-effort: never throws. */
export function save(key, value) {
  const k = PREFIX + key;
  memory.set(k, value);
  try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* best-effort */ }
}
