import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endEfficiencyTipLine } from './endEfficiencyTip';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endWinsTipLine } from './endWinsTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import {
  endWinRatePercent,
  endWinRateTipLine,
} from './endWinRateTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { pauseWinRateTipLine } from './pauseWinRateTip';

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

describe('endWinRateTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endWinRateTipLine()).toBeNull();
    expect(endWinRatePercent()).toBeNull();
  });

  it('labels Win rate · n% with middot, distinct from Played · / Record · / Streak · / Wins ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(endWinRatePercent()).toBe(100);
    const line = endWinRateTipLine();
    expect(line).toBe(t('end.winRateTip', { n: 100 }));
    expect(line).toBe('Win rate · 100%');
    expect(line).toMatch(/^Win rate \u00b7 /);
    expect(line).toMatch(/%$/);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(line).toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(line).toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    // Distinct from peer career tips (Played · / Record · / Streak · / Wins ·).
    expect(line).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe('Played · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(line).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(line).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe('Streak · 2');
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(line).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe('Wins · 2');
    expect(endWinsTipLine()).toMatch(/^Wins \u00b7 /);
    // Distinct from Efficiency · (combat tip, not career win rate).
    expect(line).not.toBe(endEfficiencyTipLine(1, 1));
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(endWinRatePercent()).toBe(67);
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 67 }));
    expect(endWinRateTipLine()).toBe('Win rate · 67%');
    expect(endWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
  });

  it('localizes Win rate middot for pt-BR and es; stays distinct from Played / Record / Streak / Wins', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const pt = endWinRateTipLine();
    expect(pt).toBe(t('end.winRateTip', { n: 100 }));
    expect(pt).toBe('Taxa · 100%');
    expect(pt).toMatch(/^Taxa \u00b7 /);
    expect(pt).toBe(lobbyWinRateTipLine());
    expect(pt).toBe(pauseWinRateTipLine(2, 2));
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pt).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Vitórias \u00b7 /);

    setLocale('es');
    const es = endWinRateTipLine();
    expect(es).toBe(t('end.winRateTip', { n: 100 }));
    expect(es).toBe('Tasa · 100%');
    expect(es).toMatch(/^Tasa \u00b7 /);
    expect(es).toBe(lobbyWinRateTipLine());
    expect(es).toBe(pauseWinRateTipLine(2, 2));
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(es).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(es).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(es).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    setLocale('en-GB');
  });
});
