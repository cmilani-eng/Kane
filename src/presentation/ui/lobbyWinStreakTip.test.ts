import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
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

describe('lobbyWinStreakTipLine', () => {
  it('is null before any finished outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyWinStreakTipLine()).toBeNull();
  });

  it('labels Streak · n, distinct from Best streak / end / pause tip keys', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak ·/);
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak ·/);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(lobbyWinStreakTipLine()).toBe(endWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
  });

  it('keeps streak when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
  });
});
