import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, speciesCopy, t } from '../../i18n';
import { endFavoriteFactionTipLine } from './endFavoriteFactionTip';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endSpeciesPlayedTipLine } from './endSpeciesPlayedTip';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  setLocale('en-GB');
});

describe('endFavoriteFactionTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endFavoriteFactionTipLine()).toBeNull();
  });

  it('labels Favorite · name from prefs, distinct from lobby key / end Played', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const name = speciesCopy('brutes').name;
    expect(endFavoriteFactionTipLine()).toBe(
      t('end.favoriteFactionTip', { name }),
    );
    expect(endFavoriteFactionTipLine()).toMatch(/^Favorite ·/);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endFavoriteFactionTipLine()).toBe(lobbyFavoriteFactionTipLine());
    expect(endFavoriteFactionTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endFavoriteFactionTipLine()).not.toBe(
      endSpeciesPlayedTipLine('brutes'),
    );
  });
});
