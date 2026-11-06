import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import firebaseJson from '../firebase.json';
import { GAMES } from './registry';

const gamesDir = dirname(fileURLToPath(import.meta.url));
const gamePages = Object.keys(import.meta.glob('./*/index.html'));
const rewrites = firebaseJson.hosting[0].rewrites.map((rule) => rule.source);
const headerRules = firebaseJson.hosting[0].headers;

/**
 * Whether a Hosting header `source` glob matches a request path. Handles the
 * forms firebase.json uses: one `{a,b}` group, `*` (one segment) and `**`.
 */
function globMatches(source: string, path: string): boolean {
  const open = source.indexOf('{');
  if (open >= 0) {
    const close = source.indexOf('}', open);
    return source
      .slice(open + 1, close)
      .split(',')
      .some((alt) => globMatches(source.slice(0, open) + alt + source.slice(close + 1), path));
  }
  const pattern = source
    .replace(/[.+?^$()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\0')
    .replace(/\*/g, '[^/]*')
    .replace(/\0/g, '.*');
  return new RegExp(`^${pattern}$`).test(path);
}

/** Hosting serves a page with cleanUrls, so users land on /id as often as /id/. */
const isNoCache = (path: string) =>
  headerRules.some(
    (rule) =>
      globMatches(rule.source, path) &&
      rule.headers.some((h) => h.key === 'Cache-Control' && h.value === 'no-cache'),
  );

describe('games registry', () => {
  it('has unique, URL-safe ids', () => {
    const ids = GAMES.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('only uses known build and status values', () => {
    for (const game of GAMES) {
      expect(['vite', 'static']).toContain(game.build);
      expect(['live', 'experimental']).toContain(game.status);
    }
  });

  it.each(GAMES.map((game) => game.id))('%s has an index.html in its games/ folder', (id) => {
    expect(gamePages).toContain(`./${id}/index.html`);
  });

  it.each(GAMES.map((game) => game.id))('%s has a Hosting rewrite before the hub catch-all', (id) => {
    const index = rewrites.indexOf(`/${id}/**`);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(rewrites.indexOf('**'));
  });

  it('loads Kane from an entry inside the Vite root', () => {
    const page = readFileSync(resolve(gamesDir, 'kane/index.html'), 'utf8');
    expect(page).toContain('src="./main.ts"');
    const entry = readFileSync(resolve(gamesDir, 'kane/main.ts'), 'utf8');
    expect(entry).toContain("import '../../src/main.ts'");
  });

  it('loads Blob Evolution from an entry inside the Vite root', () => {
    const page = readFileSync(resolve(gamesDir, 'blob-evolution/index.html'), 'utf8');
    expect(page).toContain('src="./main.js"');
    expect(GAMES.find((game) => game.id === 'blob-evolution')?.build).toBe('vite');
  });

  it('keeps Privacy and Terms pages under games/ for hub footer links', () => {
    const privacy = readFileSync(resolve(gamesDir, 'privacy.html'), 'utf8');
    const terms = readFileSync(resolve(gamesDir, 'terms.html'), 'utf8');
    expect(privacy).toContain('Privacy');
    expect(terms).toContain('Terms');
    const hub = readFileSync(resolve(gamesDir, 'index.html'), 'utf8');
    expect(hub).toContain('id="hub-privacy"');
    expect(hub).toContain('id="hub-terms"');
  });

  it('forwards old Kane hashes from the picker', () => {
    const hub = readFileSync(resolve(gamesDir, 'index.html'), 'utf8');
    expect(hub).toContain("location.replace('./kane/' + location.search + location.hash)");
  });

  it('starts the installed app at /kane/ and keeps the app id at /', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(gamesDir, '../public/manifest.webmanifest'), 'utf8'),
    ) as { id: string; start_url: string; scope: string };
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('./kane/');
    expect(manifest.scope).toBe('./');
  });

  // A stale page points at hashed bundles a newer deploy removed, and the hub
  // catch-all answers those with HTML, so a game's page must never be cached.
  it.each(GAMES.map((game) => game.id))('%s page is no-cache with and without a trailing slash', (id) => {
    for (const path of [`/${id}`, `/${id}/`, `/${id}/index.html`]) {
      expect(isNoCache(path), path).toBe(true);
    }
  });

  it('keeps the hub page no-cache', () => {
    for (const path of ['/', '/index.html']) expect(isNoCache(path), path).toBe(true);
  });

  it('leaves hashed bundles to the immutable rule, not no-cache', () => {
    expect(isNoCache('/assets/kane-abc123.js')).toBe(false);
  });
});
