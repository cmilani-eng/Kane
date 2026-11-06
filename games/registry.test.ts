import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import firebaseJson from '../firebase.json';
import { GAMES } from './registry';

const gamesDir = dirname(fileURLToPath(import.meta.url));
const gamePages = Object.keys(import.meta.glob('./*/index.html'));
const rewrites = firebaseJson.hosting[0].rewrites.map((rule) => rule.source);

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

  it('keeps the Kane client in src/', () => {
    const page = readFileSync(resolve(gamesDir, 'kane/index.html'), 'utf8');
    expect(page).toContain('src="../../src/main.ts"');
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
});
