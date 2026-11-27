import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endWinsTipLine } from './endWinsTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';
import { pauseWinRateTipLine } from './pauseWinRateTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';
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

describe('pauseWinsTipLine', () => {
  it('is null when played is not positive', () => {
    expect(pauseWinsTipLine(0, 0)).toBeNull();
    expect(pauseWinsTipLine(1, 0)).toBeNull();
    expect(pauseWinsTipLine(0, -1)).toBeNull();
  });

  it('labels Wins · n with middot, distinct from Played · / Win rate · / Record · / Streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(pauseWinsTipLine(1, 2)).toBe(t('pause.winsTip', { n: 1 }));
    expect(pauseWinsTipLine(1, 2)).toBe('Wins · 1');
    expect(pauseWinsTipLine(1, 2)).toMatch(/^Wins \u00b7 /);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseWinsTipLine(1, 2)).toBe(lobbyWinsTipLine());
    expect(pauseWinsTipLine(1, 2)).toBe(endWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 1 }));
    // Distinct from peer career tips (Played · / Win rate · / Record · / Streak ·).
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe('Played · 2');
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Played \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseWinRateTipLine(1, 2));
    expect(pauseWinRateTipLine(1, 2)).toBe(t('pause.winRateTip', { n: 50 }));
    expect(pauseWinRateTipLine(1, 2)).toBe('Win rate · 50%');
    expect(pauseWinRateTipLine(1, 2)).toMatch(/^Win rate \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 1–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toBe(t('pause.winStreakTip', { n: 1 }));
    expect(pauseWinStreakTipLine(1)).toBe('Streak · 1');
    expect(pauseWinStreakTipLine(1)).toMatch(/^Streak \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(pauseWinsTipLine(2, 3)).toBe(t('pause.winsTip', { n: 2 }));
    expect(pauseWinsTipLine(2, 3)).toBe('Wins · 2');
  });

  it('localizes Wins middot for pt-BR and es; stays distinct from Played / Win rate / Record / Streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    expect(pauseWinsTipLine(1, 2)).toBe(t('pause.winsTip', { n: 1 }));
    expect(pauseWinsTipLine(1, 2)).toBe('Vitórias · 1');
    expect(pauseWinsTipLine(1, 2)).toMatch(/^Vitórias \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).toBe(lobbyWinsTipLine());
    expect(pauseWinsTipLine(1, 2)).toBe(endWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 1 }));
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Jogadas \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseWinRateTipLine(1, 2));
    expect(pauseWinRateTipLine(1, 2)).toBe(t('pause.winRateTip', { n: 50 }));
    expect(pauseWinRateTipLine(1, 2)).toMatch(/^Taxa \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Sequência \u00b7 /);

    setLocale('es');
    expect(pauseWinsTipLine(1, 2)).toBe(t('pause.winsTip', { n: 1 }));
    expect(pauseWinsTipLine(1, 2)).toBe('Victorias · 1');
    expect(pauseWinsTipLine(1, 2)).toMatch(/^Victorias \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).toBe(lobbyWinsTipLine());
    expect(pauseWinsTipLine(1, 2)).toBe(endWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 1 }));
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Jugadas \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseWinRateTipLine(1, 2));
    expect(pauseWinRateTipLine(1, 2)).toBe(t('pause.winRateTip', { n: 50 }));
    expect(pauseWinRateTipLine(1, 2)).toMatch(/^Tasa \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(pauseWinsTipLine(1, 2)).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Racha \u00b7 /);
    setLocale('en-GB');
  });
});
