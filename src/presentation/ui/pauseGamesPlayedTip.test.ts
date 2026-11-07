import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';

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

describe('pauseGamesPlayedTipLine', () => {
  it('is null when played is not positive', () => {
    expect(pauseGamesPlayedTipLine(0)).toBeNull();
    expect(pauseGamesPlayedTipLine(-1)).toBeNull();
  });

  it('labels Played · n, distinct surface from end/lobby tip keys', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Played ·/);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseGamesPlayedTipLine(2)).toBe(lobbyGamesPlayedTipLine());
    expect(pauseGamesPlayedTipLine(2)).toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
  });
});
