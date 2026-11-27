import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbySpeciesPlaysTipLine } from './lobbySpeciesPlaysTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';

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

describe('lobbyGamesPlayedTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyGamesPlayedTipLine()).toBeNull();
  });

  it('labels Played · n with middot, distinct from Record · / Streak · / Win rate · / Plays ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    const played = lobbyGamesPlayedTipLine();
    expect(played).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(played).toBe('Played · 2');
    expect(played).toMatch(/^Played \u00b7 /);
    expect(played).toContain(' \u00b7 ');
    expect(played).not.toMatch(/ {2}/);
    expect(played).not.toMatch(/^Record \u00b7 /);
    expect(played).not.toMatch(/^Streak \u00b7 /);
    expect(played).not.toMatch(/^Win rate \u00b7 /);
    expect(played).not.toMatch(/^Plays \u00b7 /);
    expect(played).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe('Plays · 1');
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Plays \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(played).toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(played).toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    // Distinct from peer career tips (Record · / Streak · / Win rate ·).
    expect(played).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(played).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 2');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(played).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toBe('Win rate · 100%');
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    const kept = lobbyGamesPlayedTipLine();
    expect(kept).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(kept).toBe('Played · 2');
    expect(kept).toContain(' \u00b7 ');
    expect(kept).not.toMatch(/ {2}/);
    expect(kept).not.toMatch(/^Record \u00b7 /);
    expect(kept).not.toMatch(/^Streak \u00b7 /);
    expect(kept).not.toMatch(/^Win rate \u00b7 /);
    expect(kept).not.toMatch(/^Plays \u00b7 /);
  });

  it('localizes Played middot for pt-BR and es; stays distinct from Record / Streak / Win rate / Plays', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const pt = lobbyGamesPlayedTipLine();
    expect(pt).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(pt).toBe('Jogadas · 2');
    expect(pt).toMatch(/^Jogadas \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toMatch(/ {2}/);
    expect(pt).toBe(endGamesPlayedTipLine());
    expect(pt).toBe(pauseGamesPlayedTipLine(2));
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(pt).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 1 }));
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(pt).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Taxa \u00b7 /);
    expect(pt).not.toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toMatch(/^Taxa \u00b7 /);
    expect(pt).not.toMatch(/^Partidas \u00b7 /);

    setLocale('es');
    const es = lobbyGamesPlayedTipLine();
    expect(es).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(es).toBe('Jugadas · 2');
    expect(es).toMatch(/^Jugadas \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toMatch(/ {2}/);
    expect(es).toBe(endGamesPlayedTipLine());
    expect(es).toBe(pauseGamesPlayedTipLine(2));
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(es).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 1 }));
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(es).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(es).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(es).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    expect(es).not.toMatch(/^Récord \u00b7 /);
    expect(es).not.toMatch(/^Racha \u00b7 /);
    expect(es).not.toMatch(/^Tasa \u00b7 /);
    expect(es).not.toMatch(/^Partidas \u00b7 /);
    setLocale('en-GB');
  });
});
