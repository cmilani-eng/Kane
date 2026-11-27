// Post-deploy smoke test: fetch the live site and check the response headers that
// firebase.json promises. It detects a bad release, it cannot prevent one.
//
//   node scripts/checkHeaders.mjs https://kane-rts-game.web.app

/* global console, fetch, process, setTimeout, URL */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const readJson = (file) => JSON.parse(readFileSync(new URL(file, root), 'utf8'));

const NO_CACHE = 'no-cache';
const IMMUTABLE = 'public,max-age=31536000,immutable';
// Nothing ships under this name. A rewrite would answer it with 200 and the picker's HTML.
const MISSING_FILE = '/assets/missing-file-check.js';

/** The headers every response must carry: the `**` rule in firebase.json. */
export function expectedSecurityHeaders(firebaseJson) {
  const rule = firebaseJson.hosting[0].headers.find((entry) => entry.source === '**');
  return Object.fromEntries((rule?.headers ?? []).map(({ key, value }) => [key.toLowerCase(), value]));
}

function headerProblems(label, headers, expected, cacheControl) {
  const problems = [];
  for (const [key, value] of Object.entries(expected)) {
    const got = headers.get(key);
    if (got !== value) problems.push(`${label}: ${key} is ${got === null ? 'missing' : `"${got}"`}, expected "${value}"`);
  }
  if (!headers.get('strict-transport-security')) problems.push(`${label}: strict-transport-security is missing`);
  const cache = headers.get('cache-control');
  if (cache !== cacheControl) problems.push(`${label}: cache-control is ${cache === null ? 'missing' : `"${cache}"`}, expected "${cacheControl}"`);
  return problems;
}

/** One pass over the site. Returns a list of problems; empty means the headers are right. */
export async function checkSite(base, { fetchImpl = fetch, firebaseJson, games } = {}) {
  const expected = expectedSecurityHeaders(firebaseJson);
  const pages = ['/', ...games.flatMap(({ id }) => [`/${id}`, `/${id}/`]), '/privacy', '/terms', '/manifest.webmanifest'];
  const problems = [];
  let asset = null;

  for (const path of pages) {
    const res = await fetchImpl(new URL(path, base));
    const body = await res.text();
    if (res.status !== 200) problems.push(`${path}: status ${res.status}, expected 200`);
    problems.push(...headerProblems(path, res.headers, expected, NO_CACHE));
    asset ??= body.match(/\/assets\/[^"'\s]+\.js/)?.[0] ?? null;
  }

  if (!asset) {
    problems.push('no hashed /assets/*.js file is linked from any page');
  } else {
    const res = await fetchImpl(new URL(asset, base));
    await res.arrayBuffer();
    if (res.status !== 200) problems.push(`${asset}: status ${res.status}, expected 200`);
    problems.push(...headerProblems(asset, res.headers, expected, IMMUTABLE));
  }

  // A stale bundle URL must fail loudly: 200 with HTML would reach the browser as a script.
  const missing = await fetchImpl(new URL(MISSING_FILE, base));
  await missing.arrayBuffer();
  if (missing.status !== 404) problems.push(`${MISSING_FILE}: status ${missing.status}, expected 404`);
  return problems;
}

/** Retries because a fresh release can take a few seconds to reach every edge. */
export async function checkSiteWithRetries(base, options = {}, { attempts = 3, delayMs = 10_000 } = {}) {
  let problems = [];
  for (let attempt = 1; attempt <= attempts; attempt++) {
    problems = await checkSite(base, options).catch((error) => [`request failed: ${error.message}`]);
    if (problems.length === 0) return problems;
    if (attempt < attempts) await new Promise((done) => setTimeout(done, delayMs));
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const base = process.argv[2];
  if (!base) {
    console.error('usage: node scripts/checkHeaders.mjs <https://site>');
    process.exit(2);
  }
  const problems = await checkSiteWithRetries(base, {
    firebaseJson: readJson('firebase.json'),
    games: readJson('games/games.json'),
  });
  if (problems.length > 0) {
    console.error(`Header check failed for ${base}:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Header check passed for ${base}`);
}
