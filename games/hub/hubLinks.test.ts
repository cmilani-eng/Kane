import { describe, expect, it } from 'vitest';
import { GAMES } from '../registry';
import { gamePlayHref } from './hubLinks';

describe('hub game links', () => {
  it('keeps Kane at ./kane/ so hub cards open the Vite entry under /kane/', () => {
    expect(GAMES.some((game) => game.id === 'kane')).toBe(true);
    expect(gamePlayHref('kane')).toBe('./kane/');
  });

  it('keeps Blob Evolution at ./blob-evolution/ after the Vite move', () => {
    const blob = GAMES.find((game) => game.id === 'blob-evolution');
    expect(blob?.build).toBe('vite');
    expect(gamePlayHref('blob-evolution')).toBe('./blob-evolution/');
  });

  it('builds a trailing-slash relative path for every registry game', () => {
    for (const game of GAMES) {
      expect(gamePlayHref(game.id)).toBe(`./${game.id}/`);
    }
  });
});
