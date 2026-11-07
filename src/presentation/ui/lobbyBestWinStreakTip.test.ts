import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';

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

describe('lobbyBestWinStreakTipLine', () => {
  it('is null before any finished win', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyBestWinStreakTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyBestWinStreakTipLine()).toBeNull();
  });

  it('tracks peak streak and keeps it after a loss clears current', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak ·/);
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyWinStreakTipLine());

    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );

    rememberMatchPrefs('nobles', 'normal', 'crossing', 50_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
  });

  it('raises the peak when a longer streak lands', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 70_000, false);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 60_000, true);
    rememberMatchPrefs('brutes', 'normal', 'crossing', 55_000, true);
    rememberMatchPrefs('nobles', 'hard', 'ridge', 50_000, true);
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 3 }),
    );
  });
});
