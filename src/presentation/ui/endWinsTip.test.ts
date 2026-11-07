import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endLossesTipLine } from './endLossesTip';
import { endWinRateTipLine } from './endWinRateTip';
import { endWinsTipLine } from './endWinsTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';

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

describe('endWinsTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endWinsTipLine()).toBeNull();
  });

  it('labels Wins · n from prefs, distinct from lobby key / Losses / Played', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 1 }));
    expect(endWinsTipLine()).toMatch(/^Wins ·/);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endWinsTipLine()).toBe(lobbyWinsTipLine());
    expect(endWinsTipLine()).not.toBe(endLossesTipLine());
    expect(endWinsTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endWinsTipLine()).not.toBe(endWinRateTipLine());
  });
});
