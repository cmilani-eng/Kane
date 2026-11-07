import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import {
  lobbyWinRatePercent,
  lobbyWinRateTipLine,
} from './lobbyWinRateTip';

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

describe('lobbyWinRateTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyWinRateTipLine()).toBeNull();
    expect(lobbyWinRatePercent()).toBeNull();
  });

  it('labels Win rate · n% from wins over games played', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyWinRatePercent()).toBe(50);
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate ·/);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(lobbyWinRatePercent()).toBe(67);
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 67 }));
  });
});
