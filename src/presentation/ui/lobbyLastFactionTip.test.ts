import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, setLocale, t } from '../../i18n';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyFactionTipLine } from './lobbyPanel';

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

describe('lobbyLastFactionTipLine', () => {
  it('labels Last · name from match prefs species', () => {
    rememberMatchPrefs('weirdos', 'normal', 'crossing');
    const name = speciesCopy('weirdos').name;
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name }),
    );
    expect(lobbyLastFactionTipLine()).toMatch(/^Last ·/);
    expect(lobbyLastFactionTipLine()).toContain(name);
  });

  it('tracks the latest remembered species, distinct from Favorite / Played / motto', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    // Last remembered species is brutes; favorite is also brutes (2 plays).
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('brutes').name }),
    );
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorite ·/);
    expect(lobbyLastFactionTipLine()).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbyLastFactionTipLine()).not.toBe(lobbyFactionTipLine());
    expect(lobbyLastFactionTipLine()).not.toBe(lobbyGamesPlayedTipLine());

    // Rematch prefs without outcome still update last faction.
    rememberMatchPrefs('weirdos', 'normal', 'crossing');
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('weirdos').name }),
    );
    // Favorite stays on most-played (brutes).
    expect(lobbyFavoriteFactionTipLine()).toBe(
      t('lobby.favoriteFactionTip', {
        name: speciesCopy('brutes').name,
      }),
    );
  });
});
