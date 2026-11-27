import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
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

  it('labels Record · w–l with middot, distinct from Wins · / Losses · / Win rate · / Played ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    const record = lobbyRecordTipLine();
    expect(record).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(record).toBe('Record · 1–1');
    expect(record).toMatch(/^Record \u00b7 /);
    expect(record).toContain(' \u00b7 ');
    expect(record).not.toMatch(/ {2}/);
    expect(record).toContain('\u2013');
    expect(record).not.toMatch(/^Wins \u00b7 /);
    expect(record).not.toMatch(/^Losses \u00b7 /);
    expect(record).not.toMatch(/^Win rate \u00b7 /);
    expect(record).not.toMatch(/^Played \u00b7 /);
    // Lobby-only tip (no pause/end Record · twin).
    expect(record).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 1');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(record).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toBe('Losses · 1');
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
    expect(record).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toBe('Win rate · 50%');
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    expect(record).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Played · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
  });

  it('localizes Record middot for pt-BR and es; stays distinct from Wins / Losses / Win rate / Played', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    const pt = lobbyRecordTipLine();
    expect(pt).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(pt).toBe('Recorde · 1–1');
    expect(pt).toMatch(/^Recorde \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toMatch(/ {2}/);
    expect(pt).toContain('\u2013');
    expect(pt).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toBe('Vitórias · 1');
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toBe('Derrotas · 1');
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(pt).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toBe('Taxa · 50%');
    expect(lobbyWinRateTipLine()).toMatch(/^Taxa \u00b7 /);
    expect(pt).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Jogadas · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toMatch(/^Derrotas \u00b7 /);
    expect(pt).not.toMatch(/^Taxa \u00b7 /);
    expect(pt).not.toMatch(/^Jogadas \u00b7 /);

    setLocale('es');
    const es = lobbyRecordTipLine();
    expect(es).toBe(t('lobby.recordTip', { w: 1, l: 1 }));
    expect(es).toBe('Récord · 1–1');
    expect(es).toMatch(/^Récord \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toMatch(/ {2}/);
    expect(es).toContain('\u2013');
    expect(es).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toBe('Victorias · 1');
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(es).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toBe('Derrotas · 1');
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(es).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 50 }));
    expect(lobbyWinRateTipLine()).toBe('Tasa · 50%');
    expect(lobbyWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    expect(es).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Jugadas · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toMatch(/^Victorias \u00b7 /);
    expect(es).not.toMatch(/^Derrotas \u00b7 /);
    expect(es).not.toMatch(/^Tasa \u00b7 /);
    expect(es).not.toMatch(/^Jugadas \u00b7 /);
    setLocale('en-GB');
  });
});
