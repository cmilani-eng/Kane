import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { endEfficiencyTipLine } from './endEfficiencyTip';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endWinRatePercent, endWinRateTipLine } from './endWinRateTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';

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

describe('endWinRateTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endWinRateTipLine()).toBeNull();
    expect(endWinRatePercent()).toBeNull();
  });

  it('labels Win rate · n% from prefs, distinct from lobby key / Efficiency', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(endWinRatePercent()).toBe(50);
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toMatch(/^Win rate ·/);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endWinRateTipLine()).toBe(lobbyWinRateTipLine());
    expect(endWinRateTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endWinRateTipLine()).not.toBe(endEfficiencyTipLine(1, 1));
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(endWinRatePercent()).toBe(67);
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 67 }));
  });
});
