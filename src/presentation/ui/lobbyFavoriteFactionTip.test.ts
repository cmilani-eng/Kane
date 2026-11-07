import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, setLocale, t } from '../../i18n';
import {
  favoriteFactionId,
  lobbyFavoriteFactionTipLine,
} from './lobbyFavoriteFactionTip';

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

describe('lobbyFavoriteFactionTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(favoriteFactionId()).toBeNull();
    expect(lobbyFavoriteFactionTipLine()).toBeNull();
  });

  it('labels Favorite · name for the most-played species', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    expect(favoriteFactionId()).toBe('brutes');
    const name = speciesCopy('brutes').name;
    expect(lobbyFavoriteFactionTipLine()).toBe(
      t('lobby.favoriteFactionTip', { name }),
    );
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorite ·/);
  });
});
