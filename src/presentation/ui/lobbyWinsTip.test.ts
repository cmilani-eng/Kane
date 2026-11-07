import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endWinsTipLine } from './endWinsTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { lobbyWinsCount, lobbyWinsTipLine } from './lobbyWinsTip';
import { pauseWinsTipLine } from './pauseWinsTip';

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

  it('labels Wins · n with middot, distinct from Played · / Record · / Streak · / Win rate ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(lobbyWinsCount()).toBe(2);
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 2');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(lobbyWinsTipLine()).toBe(endWinsTipLine());
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe(pauseWinsTipLine(2, 2));
    expect(pauseWinsTipLine(2, 2)).toBe(t('pause.winsTip', { n: 2 }));
    // Distinct from peer career tips (Played · / Record · / Streak · / Win rate ·).
    expect(lobbyWinsTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Played · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 2');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toBe('Win rate · 100%');
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(lobbyWinsCount()).toBe(2);
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 2');
  });

  it('localizes Wins middot for pt-BR and es; stays distinct from Played / Record / Streak / Win rate', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Vitórias · 2');
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(lobbyWinsTipLine()).toBe(endWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(pauseWinsTipLine(2, 2));
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(pauseWinsTipLine(2, 2)).toBe(t('pause.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Taxa \u00b7 /);

    setLocale('es');
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Victorias · 2');
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(lobbyWinsTipLine()).toBe(endWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(pauseWinsTipLine(2, 2));
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(pauseWinsTipLine(2, 2)).toBe(t('pause.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(lobbyWinsTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    setLocale('en-GB');
  });
});
