import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, speciesCopy, t } from '../../i18n';
import { endFavoriteFactionTipLine } from './endFavoriteFactionTip';
import {
  favoriteFactionId,
  lobbyFavoriteFactionTipLine,
} from './lobbyFavoriteFactionTip';
import { pauseFavoriteFactionTipLine } from './pauseFavoriteFactionTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';

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

describe('pauseFavoriteFactionTipLine', () => {
  it('is null when no favorite species id', () => {
    expect(pauseFavoriteFactionTipLine(null)).toBeNull();
    expect(pauseFavoriteFactionTipLine(undefined)).toBeNull();
  });

  it('labels Favorite · name, distinct surface from lobby/end tip keys', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const id = favoriteFactionId();
    expect(id).toBe('brutes');
    const name = speciesCopy('brutes').name;
    expect(pauseFavoriteFactionTipLine(id)).toBe(
      t('pause.favoriteFactionTip', { name }),
    );
    expect(pauseFavoriteFactionTipLine(id)).toMatch(/^Favorite ·/);
    expect(pauseFavoriteFactionTipLine(id)).not.toBe(
      pauseGamesPlayedTipLine(3),
    );
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseFavoriteFactionTipLine(id)).toBe(lobbyFavoriteFactionTipLine());
    expect(pauseFavoriteFactionTipLine(id)).toBe(endFavoriteFactionTipLine());
    expect(endFavoriteFactionTipLine()).toBe(
      t('end.favoriteFactionTip', { name }),
    );
  });
});
