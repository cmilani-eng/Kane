import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';

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

describe('lobbyRecordTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyRecordTipLine()).toBeNull();
  });

  it('labels Record · w–l with middot, distinct from Wins · / Losses · / Win rate ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 1–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(lobbyRecordTipLine()).toContain('\u2013');
    expect(lobbyRecordTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(lobbyRecordTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
    expect(lobbyRecordTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–1');
  });

  it('localizes Record middot for pt-BR and es; stays distinct from Wins / Losses / Win rate', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    setLocale('pt-BR');
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Recorde · 1–1');
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(lobbyRecordTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyRecordTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyRecordTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    setLocale('es');
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Récord · 1–1');
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(lobbyRecordTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyRecordTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyRecordTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    setLocale('en-GB');
  });
});
