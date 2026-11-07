import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endLossesTipLine } from './endLossesTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';
import { endWinRateTipLine } from './endWinRateTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';

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

describe('endLossesTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endLossesTipLine()).toBeNull();
  });

  it('labels Losses · n from prefs, distinct from lobby key / Played / Lost', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).toMatch(/^Losses ·/);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endLossesTipLine()).toBe(lobbyLossesTipLine());
    expect(endLossesTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endLossesTipLine()).not.toBe(endWinRateTipLine());
    expect(endLossesTipLine()).not.toBe(endUnitsLostTipLine(1));
  });
});
