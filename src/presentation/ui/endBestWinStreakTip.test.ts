import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';

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

describe('endBestWinStreakTipLine', () => {
  it('is null before any finished win', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endBestWinStreakTipLine()).toBeNull();
  });

  it('labels Best streak · n and keeps peak after a loss', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak ·/);
    expect(endBestWinStreakTipLine()).not.toBe(endWinStreakTipLine());
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endBestWinStreakTipLine()).toBe(lobbyBestWinStreakTipLine());
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(endWinStreakTipLine()).toBeNull();
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
  });
});
