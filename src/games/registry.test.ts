import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_REGISTRY } from './registry';

const publicDir = resolve(import.meta.dirname, '../../public');

describe('game registry', () => {
  it('gives every game its own id and scene key', () => {
    const ids = GAME_REGISTRY.map((game) => game.id);
    const sceneKeys = GAME_REGISTRY.map((game) => game.sceneKey);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(sceneKeys).size).toBe(sceneKeys.length);
  });

  // The picker draws this picture on the card; a typo would leave the card on its placeholder.
  it.each(GAME_REGISTRY.map((game) => [game.id, game.cover] as const))(
    '%s has a card picture that exists under public/',
    (_id, cover) => {
      expect(cover).toBeTruthy();
      expect(existsSync(resolve(publicDir, cover ?? ''))).toBe(true);
    },
  );

  it('writes picture paths relative to the site root, so any base path works', () => {
    for (const game of GAME_REGISTRY) expect(game.cover?.startsWith('/')).toBe(false);
  });
});
