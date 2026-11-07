import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
});

afterEach(() => {
  store.clear();
});

describe('endWinStreakTipLine', () => {
  it('is null before any finished win', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endWinStreakTipLine()).toBeNull();
  });

  it('labels Streak · n after wins, distinct from Best streak / pause tip', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 1 }));
    expect(endWinStreakTipLine()).toMatch(/^Streak ·/);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak ·/);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endWinStreakTipLine()).toBe(lobbyWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(endWinStreakTipLine()).toBeNull();
  });
});
