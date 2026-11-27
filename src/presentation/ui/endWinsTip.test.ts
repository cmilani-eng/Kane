import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endWinRateTipLine } from './endWinRateTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { endWinsTipLine } from './endWinsTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
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

describe('endWinsTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endWinsTipLine()).toBeNull();
  });

  it('labels Wins · n with middot, distinct from Played · / Record · / Streak · / Win rate ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe('Wins · 2');
    expect(endWinsTipLine()).toMatch(/^Wins \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endWinsTipLine()).toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe(pauseWinsTipLine(2, 2));
    expect(pauseWinsTipLine(2, 2)).toBe(t('pause.winsTip', { n: 2 }));
    // Distinct from peer career tips (Played · / Record · / Streak · / Win rate ·).
    expect(endWinsTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe('Played · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(endWinsTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(endWinsTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(endWinsTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe('Streak · 2');
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(endWinsTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinRateTipLine()).toBe('Win rate · 100%');
    expect(endWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe('Wins · 2');
  });

  it('localizes Wins middot for pt-BR and es; stays distinct from Played / Record / Streak / Win rate', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe('Vitórias · 2');
    expect(endWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(endWinsTipLine()).toBe(lobbyWinsTipLine());
    expect(endWinsTipLine()).toBe(pauseWinsTipLine(2, 2));
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(pauseWinsTipLine(2, 2)).toBe(t('pause.winsTip', { n: 2 }));
    expect(endWinsTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(endWinsTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(endWinsTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(endWinsTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinRateTipLine()).toMatch(/^Taxa \u00b7 /);

    setLocale('es');
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe('Victorias · 2');
    expect(endWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(endWinsTipLine()).toBe(lobbyWinsTipLine());
    expect(endWinsTipLine()).toBe(pauseWinsTipLine(2, 2));
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(pauseWinsTipLine(2, 2)).toBe(t('pause.winsTip', { n: 2 }));
    expect(endWinsTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(endWinsTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(endWinsTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(endWinsTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    setLocale('en-GB');
  });
});
