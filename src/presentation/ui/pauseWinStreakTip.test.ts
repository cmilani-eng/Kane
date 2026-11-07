import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';
import { rememberMatchPrefs } from '../../database/matchPrefs';

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

describe('pauseWinStreakTipLine', () => {
  it('is null when streak is not positive', () => {
    expect(pauseWinStreakTipLine(0)).toBeNull();
    expect(pauseWinStreakTipLine(-1)).toBeNull();
  });

  it('labels Streak · n, distinct surface from lobby/end tip keys', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: memoryStorage(),
      configurable: true,
    });
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(pauseWinStreakTipLine(1)).toBe(t('pause.winStreakTip', { n: 1 }));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Streak ·/);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseWinStreakTipLine(1)).toBe(lobbyWinStreakTipLine());
    expect(pauseWinStreakTipLine(1)).toBe(endWinStreakTipLine());
  });
});
