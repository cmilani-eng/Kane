import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endWinRateTipLine } from './endWinRateTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';
import {
  pauseWinRatePercent,
  pauseWinRateTipLine,
} from './pauseWinRateTip';

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

describe('pauseWinRateTipLine', () => {
  it('is null when played is not positive', () => {
    expect(pauseWinRateTipLine(0, 0)).toBeNull();
    expect(pauseWinRateTipLine(1, 0)).toBeNull();
    expect(pauseWinRateTipLine(0, -1)).toBeNull();
    expect(pauseWinRatePercent(1, 0)).toBeNull();
  });

  it('labels Win rate · n%, distinct surface from lobby/end tip keys', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(pauseWinRatePercent(1, 2)).toBe(50);
    expect(pauseWinRateTipLine(1, 2)).toBe(t('pause.winRateTip', { n: 50 }));
    expect(pauseWinRateTipLine(1, 2)).toBe('Win rate · 50%');
    expect(pauseWinRateTipLine(1, 2)).toMatch(/^Win rate \u00b7 /);
    expect(pauseWinRateTipLine(1, 2)).toMatch(/%$/);
    expect(pauseWinRateTipLine(1, 2)).not.toBe(pauseGamesPlayedTipLine(2));
    expect(pauseWinRateTipLine(1, 2)).not.toBe(pauseWinStreakTipLine(1));
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseWinRateTipLine(1, 2)).toBe(lobbyWinRateTipLine());
    expect(pauseWinRateTipLine(1, 2)).toBe(endWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(pauseWinRatePercent(2, 3)).toBe(67);
    expect(pauseWinRateTipLine(2, 3)).toBe(t('pause.winRateTip', { n: 67 }));
    expect(pauseWinRateTipLine(2, 3)).toBe('Win rate · 67%');
  });

  it('localizes Win rate middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    setLocale('pt-BR');
    expect(pauseWinRateTipLine(1, 2)).toBe(t('pause.winRateTip', { n: 50 }));
    expect(pauseWinRateTipLine(1, 2)).toBe('Taxa · 50%');
    expect(pauseWinRateTipLine(1, 2)).toMatch(/^Taxa \u00b7 /);
    expect(pauseWinRateTipLine(1, 2)).toBe(lobbyWinRateTipLine());
    expect(pauseWinRateTipLine(1, 2)).toBe(endWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    setLocale('es');
    expect(pauseWinRateTipLine(1, 2)).toBe(t('pause.winRateTip', { n: 50 }));
    expect(pauseWinRateTipLine(1, 2)).toBe('Tasa · 50%');
    expect(pauseWinRateTipLine(1, 2)).toMatch(/^Tasa \u00b7 /);
    expect(pauseWinRateTipLine(1, 2)).toBe(lobbyWinRateTipLine());
    expect(pauseWinRateTipLine(1, 2)).toBe(endWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    setLocale('en-GB');
  });
});
