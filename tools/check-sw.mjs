/**
 * check-sw.mjs — verify the service-worker precache. Run with: node tools/check-sw.mjs
 *
 * Three checks:
 *   1. Completeness — every deployable app file is listed in ASSETS, so a new
 *      module cannot silently break offline play.
 *   2. No dead entries — every ASSETS entry exists on disk. A missing file
 *      makes cache.addAll reject and breaks the whole install.
 *   3. Version bump — when a committed precached file differs from origin/main,
 *      the CACHE constant must differ too, or clients keep the old version.
 *      (Checks commits only — commit first, then run.)
 *
 * The precache set is: index.html, manifest.webmanifest, everything in css/,
 * every .js under src/, every .png under assets/, and every audio file under
 * assets/sounds/. assets/private/ is ignored (gitignored personal files).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// ---- parse CACHE + ASSETS out of sw.js -------------------------------------
const sw = readFileSync(path.join(root, 'sw.js'), 'utf8');
const cacheName = sw.match(/const CACHE = '([^']+)'/)?.[1];
const assetsBlock = sw.match(/const ASSETS = \[([\s\S]*?)\];/)?.[1];
if (!cacheName || !assetsBlock) {
  console.error('check-sw: could not parse CACHE / ASSETS out of sw.js');
  process.exit(1);
}
const listed = [...assetsBlock.matchAll(/'([^']+)'/g)]
  .map((m) => m[1])
  .filter((p) => p !== './');

// ---- the expected precache set ---------------------------------------------
function walk(dir, keep) {
  const abs = path.join(root, dir);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (rel === 'assets/private') continue;
    if (entry.isDirectory()) out.push(...walk(rel, keep));
    else if (keep(entry.name)) out.push(rel);
  }
  return out;
}

const soundsManifest = 'assets/sounds/manifest.json';
const expected = [
  'index.html',
  'manifest.webmanifest',
  ...walk('css', () => true),
  ...walk('src', (f) => f.endsWith('.js')),
  ...walk('assets', (f) => f.endsWith('.png') || /\.(mp3|m4a|ogg|wav)$/.test(f)),
  ...(existsSync(path.join(root, soundsManifest)) ? [soundsManifest] : []),
];

// ---- checks 1 + 2 -----------------------------------------------------------
const listedSet = new Set(listed);
for (const f of expected) {
  if (!listedSet.has(f)) errors.push(`missing from ASSETS: ${f}`);
}
for (const f of listed) {
  if (!existsSync(path.join(root, f))) errors.push(`dead ASSETS entry (no such file): ${f}`);
}

// ---- check: recorded sounds are credited and match the manifest -------------
// The manifest drives client preloading, so it must exactly match the files on
// disk (a name with no file 404s; a file not listed is silently never used).
// And every sound file needs a CREDITS.md line — the license ledger stays honest.
const soundFiles = walk('assets/sounds', (f) => /\.(mp3|m4a|ogg|wav)$/.test(f));
const creditsPath = path.join(root, 'assets/sounds/CREDITS.md');
const credits = existsSync(creditsPath) ? readFileSync(creditsPath, 'utf8') : '';
for (const f of soundFiles) {
  const rel = f.replace(/^assets\/sounds\//, ''); // e.g. animals/cow.mp3
  // Match the documented backticked token (`animals/cow.mp3`) so prose or a
  // format example never counts as a credit.
  if (!credits.includes('`' + rel + '`')) errors.push(`sound file has no CREDITS.md entry: ${rel}`);
}

// Manifest vs disk: base names per folder must match the actual files exactly.
const manifestPath = path.join(root, soundsManifest);
if (existsSync(manifestPath)) {
  let manifest = {};
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
  catch { errors.push(`${soundsManifest} is not valid JSON`); }
  const onDisk = {};
  for (const f of soundFiles) {
    const [folder, file] = f.replace(/^assets\/sounds\//, '').split('/');
    (onDisk[folder] ||= []).push(file.replace(/\.[^.]+$/, ''));
  }
  const folders = new Set([...Object.keys(manifest), ...Object.keys(onDisk)]);
  for (const folder of folders) {
    const listed = new Set(manifest[folder] || []);
    const present = new Set(onDisk[folder] || []);
    for (const n of listed) if (!present.has(n)) errors.push(`manifest lists ${folder}/${n} but no such file exists`);
    for (const n of present) if (!listed.has(n)) errors.push(`${folder}/${n} exists but is missing from ${soundsManifest}`);
  }
}

// ---- check 3: CACHE bump vs origin/main -------------------------------------
function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}
let baseSw = null;
try {
  baseSw = git('show', 'origin/main:sw.js');
} catch {
  // No origin/main baseline (fresh clone or first push) — skip the bump check.
}
if (baseSw) {
  const baseCache = baseSw.match(/const CACHE = '([^']+)'/)?.[1];
  const changed = git('diff', '--name-only', 'origin/main...HEAD').split('\n').filter(Boolean);
  const expectedSet = new Set(expected);
  const precachedChanged = changed.filter((f) => expectedSet.has(f) || f === 'sw.js');
  if (precachedChanged.length > 0 && baseCache === cacheName) {
    errors.push(`precached files changed but CACHE is still "${cacheName}" — bump it in sw.js`);
    for (const f of precachedChanged) errors.push(`  changed: ${f}`);
  }
}

if (errors.length > 0) {
  console.error(`check-sw: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`check-sw: OK — ${listed.length} assets precached as "${cacheName}"`);
