import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endWinRateTipLine } from './endWinRateTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import {
  lobbyWinRatePercent,
  lobbyWinRateTipLine,
} from './lobbyWinRateTip';
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

describe('lobbyWinRateTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyWinRateTipLine()).toBeNull();
    expect(lobbyWinRatePercent()).toBeNull();
  });

  it('labels Win rate · n% with middot, distinct from Played · / Record · / Streak · / Wins ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(lobbyWinRatePercent()).toBe(100);
    const line = lobbyWinRateTipLine();
    expect(line).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(line).toBe('Win rate · 100%');
    expect(line).toMatch(/^Win rate \u00b7 /);
    expect(line).toMatch(/%$/);
    // Same en copy as pause/end tips; distinct i18n key / surface.
    expect(line).toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(line).toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    // Distinct from peer career tips (Played · / Record · / Streak · / Wins ·).
    expect(line).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Played · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(line).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(line).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 2');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(line).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 2');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(lobbyWinRatePercent()).toBe(67);
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 67 }));
    expect(lobbyWinRateTipLine()).toBe('Win rate · 67%');
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
  });

  it('localizes Win rate middot for pt-BR and es; stays distinct from Played / Record / Streak / Wins', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const pt = lobbyWinRateTipLine();
    expect(pt).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(pt).toBe('Taxa · 100%');
    expect(pt).toMatch(/^Taxa \u00b7 /);
    expect(pt).toBe(endWinRateTipLine());
    expect(pt).toBe(pauseWinRateTipLine(2, 2));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pt).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);

    setLocale('es');
    const es = lobbyWinRateTipLine();
    expect(es).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(es).toBe('Tasa · 100%');
    expect(es).toMatch(/^Tasa \u00b7 /);
    expect(es).toBe(endWinRateTipLine());
    expect(es).toBe(pauseWinRateTipLine(2, 2));
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(es).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(es).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(es).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    setLocale('en-GB');
  });
});
