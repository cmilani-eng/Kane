import { describe, expect, it } from 'vitest';
import firebaseJson from '../firebase.json';
import { GAMES } from './registry';

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
});
