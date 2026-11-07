import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { lobbyWinsCount, lobbyWinsTipLine } from './lobbyWinsTip';

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

describe('lobbyWinsTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyWinsTipLine()).toBeNull();
    expect(lobbyWinsCount()).toBeNull();
  });

  it('labels Wins · n from match prefs gamesWon', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(lobbyWinsCount()).toBe(1);
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toMatch(/^Wins ·/);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyWinsCount()).toBe(1);
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(lobbyWinsCount()).toBe(2);
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyWinsTipLine()).not.toBe(lobbyWinRateTipLine());
  });
});
