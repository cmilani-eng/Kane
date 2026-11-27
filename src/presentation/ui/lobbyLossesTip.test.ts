import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endLossesTipLine } from './endLossesTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLossesCount, lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
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

describe('lobbyLossesTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLossesTipLine()).toBeNull();
    expect(lobbyLossesCount()).toBeNull();
  });

  it('labels Losses · n with middot, distinct from Played · / Record · / Wins · / Win rate · / Loss streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(lobbyLossesCount()).toBe(0);
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 0 }));
    expect(lobbyLossesTipLine()).toBe('Losses · 0');
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyLossesCount()).toBe(1);
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toBe('Losses · 1');
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
    // Same en copy as end tip; distinct i18n key / surface (no pause Losses tip).
    expect(lobbyLossesTipLine()).toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    // Distinct from peer career tips (Played · / Record · / Wins · / Win rate · / Loss streak ·).
    expect(lobbyLossesTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Played · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 1–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 1');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toBe('Win rate · 50%');
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toBe('Loss streak · 1');
    expect(lobbyLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(lobbyLossesCount()).toBe(2);
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toBe('Losses · 2');
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
  });

  it('localizes Losses middot for pt-BR and es; stays distinct from Played / Record / Wins / Win rate / Loss streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toBe('Derrotas · 1');
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(lobbyLossesTipLine()).toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Taxa \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);

    setLocale('es');
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toBe('Derrotas · 1');
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(lobbyLossesTipLine()).toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    expect(lobbyLossesTipLine()).not.toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
