import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endLossesTipLine } from './endLossesTip';
import { endLossStreakTipLine } from './endLossStreakTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';
import { endWinRateTipLine } from './endWinRateTip';
import { endWinsTipLine } from './endWinsTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';

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

describe('endLossesTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endLossesTipLine()).toBeNull();
  });

  it('labels Losses · n with middot, distinct from Played · / Record · / Wins · / Win rate · / Loss streak · / Lost ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).toBe('Losses · 1');
    expect(endLossesTipLine()).toMatch(/^Losses \u00b7 /);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endLossesTipLine()).toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    // Distinct from peer career tips + match Lost · units tip.
    expect(endLossesTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe('Played · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(endLossesTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(endLossesTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 1–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 1 }));
    expect(endWinsTipLine()).toBe('Wins · 1');
    expect(endWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe('Win rate · 50%');
    expect(endWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toBe('Loss streak · 1');
    expect(endLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endUnitsLostTipLine(1));
    expect(endUnitsLostTipLine(1)).toBe(t('end.lostTip', { n: 1 }));
    expect(endUnitsLostTipLine(1)).toBe('Lost · 1');
    expect(endUnitsLostTipLine(1)).toMatch(/^Lost \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 2 }));
    expect(endLossesTipLine()).toBe('Losses · 2');
  });

  it('localizes Losses middot for pt-BR and es; stays distinct from Played / Record / Wins / Win rate / Loss streak / Lost', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).toBe('Derrotas · 1');
    expect(endLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(endLossesTipLine()).toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(endLossesTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toMatch(/^Taxa \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endUnitsLostTipLine(1));
    expect(endUnitsLostTipLine(1)).toMatch(/^Perdidos \u00b7 /);

    setLocale('es');
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).toBe('Derrotas · 1');
    expect(endLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(endLossesTipLine()).toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(endLossesTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    expect(endLossesTipLine()).not.toBe(endUnitsLostTipLine(1));
    expect(endUnitsLostTipLine(1)).toMatch(/^Perdidos \u00b7 /);
    setLocale('en-GB');
  });
});
