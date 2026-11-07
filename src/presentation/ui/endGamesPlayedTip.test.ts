import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endSpeciesPlayedTipLine } from './endSpeciesPlayedTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
});

afterEach(() => {
  store.clear();
});

describe('endGamesPlayedTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endGamesPlayedTipLine()).toBeNull();
  });

  it('labels Played · n from prefs, distinct from species tip / lobby key', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toMatch(/^Played ·/);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endGamesPlayedTipLine()).toBe(lobbyGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).not.toBe(
      endSpeciesPlayedTipLine('nobles'),
    );
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
  });
});
