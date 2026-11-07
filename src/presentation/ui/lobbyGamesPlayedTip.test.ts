import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbySpeciesPlaysTipLine } from './lobbySpeciesPlaysTip';
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

describe('lobbyGamesPlayedTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyGamesPlayedTipLine()).toBeNull();
  });

  it('labels Played · n, distinct from Plays tip and end/pause tip keys', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7/);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbySpeciesPlaysTipLine());
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(lobbyGamesPlayedTipLine()).toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
  });
});
