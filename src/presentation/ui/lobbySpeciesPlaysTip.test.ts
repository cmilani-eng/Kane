import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import {
  lobbySpeciesPlaysCount,
  lobbySpeciesPlaysTipLine,
} from './lobbySpeciesPlaysTip';

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

describe('lobbySpeciesPlaysTipLine', () => {
  it('returns null before any finished species plays', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbySpeciesPlaysCount()).toBeNull();
    expect(lobbySpeciesPlaysTipLine()).toBeNull();
  });

  it('labels Plays · n for favorite species, distinct from Played / Favorite / Last', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    // Favorite is brutes with 2 plays; total Played is 3.
    expect(lobbySpeciesPlaysCount()).toBe(2);
    expect(lobbySpeciesPlaysTipLine()).toBe(
      t('lobby.speciesPlaysTip', { n: 2 }),
    );
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Plays ·/);
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyLastFactionTipLine());
  });
});
