import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLossesCount, lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';

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

describe('lobbyLossesTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLossesTipLine()).toBeNull();
    expect(lobbyLossesCount()).toBeNull();
  });

  it('labels Losses · n as gamesPlayed − gamesWon', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(lobbyLossesCount()).toBe(0);
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 0 }));
    expect(lobbyLossesTipLine()).toMatch(/^Losses ·/);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyLossesCount()).toBe(1);
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(lobbyLossesCount()).toBe(2);
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyLossesTipLine()).not.toBe(lobbyWinRateTipLine());
  });
});
