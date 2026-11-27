import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import firebaseJson from '../firebase.json';
import { GAME_REGISTRY } from '../src/games/registry';

type Route = { source: string; destination: string; type?: number };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hosting = firebaseJson.hosting[0] as { redirects?: Route[]; rewrites?: Route[] };
const redirects = hosting.redirects ?? [];
const rewrites = hosting.rewrites ?? [];

describe('hosting routes for the single-engine site', () => {
  // The site is one page now (index.html), so the old per-game paths redirect into it and the
  // picker starts the game from ?game=<id>. Old links and bookmarks must keep working.
  it.each(GAME_REGISTRY.map((game) => game.id))('%s keeps its old path, with and without a slash', (id) => {
    for (const source of [`/${id}`, `/${id}/`]) {
      expect(redirects.find((route) => route.source === source)?.destination).toBe(`/?game=${id}`);
    }
  });

  it.each(['privacy', 'terms'])('serves %s at the clean and the .html path', (page) => {
    for (const source of [`/${page}`, `/${page}.html`]) {
      expect(rewrites.find((route) => route.source === source)?.destination).toBe(`/games/${page}.html`);
    }
  });

  it('builds the legal pages where the rewrites point', () => {
    const viteConfig = readFileSync(resolve(root, 'vite.config.ts'), 'utf8');
    for (const page of ['privacy', 'terms']) {
      expect(existsSync(resolve(root, `games/${page}.html`))).toBe(true);
      expect(viteConfig).toContain(`games/${page}.html`);
    }
  });

  // A catch-all rewrite would answer a missing file with 200 and the picker's HTML.
  it('has no catch-all rewrite, so a missing file stays a real 404', () => {
    for (const { source } of rewrites) expect(source).not.toContain('*');
  });
});
