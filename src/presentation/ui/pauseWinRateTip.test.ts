import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endEfficiencyTipLine } from './endEfficiencyTip';
import { endWinRateTipLine } from './endWinRateTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';
import { pauseWinsTipLine } from './pauseWinsTip';
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

  it('labels Win rate · n% with middot, distinct from Played · / Record · / Streak · / Wins · / Efficiency ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(pauseWinRatePercent(1, 2)).toBe(50);
    const line = pauseWinRateTipLine(1, 2);
    expect(line).toBe(t('pause.winRateTip', { n: 50 }));
    expect(line).toBe('Win rate · 50%');
    expect(line).toMatch(/^Win rate \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    expect(line).not.toMatch(/ {2}/);
    expect(line).toMatch(/%$/);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(line).toBe(lobbyWinRateTipLine());
    expect(line).toBe(endWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    // Distinct from peer career tips (Played · / Record · / Streak · / Wins ·).
    expect(line).not.toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe('Played · 2');
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Played \u00b7 /);
    expect(line).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 1–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(line).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toBe(t('pause.winStreakTip', { n: 1 }));
    expect(pauseWinStreakTipLine(1)).toBe('Streak · 1');
    expect(pauseWinStreakTipLine(1)).toMatch(/^Streak \u00b7 /);
    expect(line).not.toBe(pauseWinsTipLine(1, 2));
    expect(pauseWinsTipLine(1, 2)).toBe(t('pause.winsTip', { n: 1 }));
    expect(pauseWinsTipLine(1, 2)).toBe('Wins · 1');
    expect(pauseWinsTipLine(1, 2)).toMatch(/^Wins \u00b7 /);
    // Distinct from Efficiency · (combat tip, not career win rate).
    expect(line).not.toBe(endEfficiencyTipLine(1, 1));
    expect(endEfficiencyTipLine(1, 1)).toBe(t('end.efficiencyTip', { pct: 50 }));
    expect(endEfficiencyTipLine(1, 1)).toBe('Efficiency · 50%');
    expect(endEfficiencyTipLine(1, 1)).toMatch(/^Efficiency \u00b7 /);
    expect(line).not.toMatch(/^Played \u00b7 /);
    expect(line).not.toMatch(/^Record \u00b7 /);
    expect(line).not.toMatch(/^Streak \u00b7 /);
    expect(line).not.toMatch(/^Wins \u00b7 /);
    expect(line).not.toMatch(/^Efficiency \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(pauseWinRatePercent(2, 3)).toBe(67);
    expect(pauseWinRateTipLine(2, 3)).toBe(t('pause.winRateTip', { n: 67 }));
    expect(pauseWinRateTipLine(2, 3)).toBe('Win rate · 67%');
    expect(pauseWinRateTipLine(2, 3)).toMatch(/^Win rate \u00b7 /);
  });

  it('localizes Win rate middot for pt-BR and es; stays distinct from Played / Record / Streak / Wins / Efficiency', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    const pt = pauseWinRateTipLine(1, 2);
    expect(pt).toBe(t('pause.winRateTip', { n: 50 }));
    expect(pt).toBe('Taxa · 50%');
    expect(pt).toMatch(/^Taxa \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toMatch(/ {2}/);
    expect(pt).toBe(lobbyWinRateTipLine());
    expect(pt).toBe(endWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(pt).not.toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toBe(pauseWinsTipLine(1, 2));
    expect(pauseWinsTipLine(1, 2)).toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toBe(endEfficiencyTipLine(1, 1));
    expect(endEfficiencyTipLine(1, 1)).toMatch(/^Eficiência \u00b7 /);
    expect(pt).not.toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toMatch(/^Eficiência \u00b7 /);

    setLocale('es');
    const es = pauseWinRateTipLine(1, 2);
    expect(es).toBe(t('pause.winRateTip', { n: 50 }));
    expect(es).toBe('Tasa · 50%');
    expect(es).toMatch(/^Tasa \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toMatch(/ {2}/);
    expect(es).toBe(lobbyWinRateTipLine());
    expect(es).toBe(endWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(es).not.toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(es).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Racha \u00b7 /);
    expect(es).not.toBe(pauseWinsTipLine(1, 2));
    expect(pauseWinsTipLine(1, 2)).toMatch(/^Victorias \u00b7 /);
    expect(es).not.toBe(endEfficiencyTipLine(1, 1));
    expect(endEfficiencyTipLine(1, 1)).toMatch(/^Eficiencia \u00b7 /);
    expect(es).not.toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toMatch(/^Récord \u00b7 /);
    expect(es).not.toMatch(/^Racha \u00b7 /);
    expect(es).not.toMatch(/^Victorias \u00b7 /);
    expect(es).not.toMatch(/^Eficiencia \u00b7 /);
    setLocale('en-GB');
  });
});
