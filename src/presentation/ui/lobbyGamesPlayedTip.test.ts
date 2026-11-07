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
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Played · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Plays \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(lobbyGamesPlayedTipLine()).toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe(pauseGamesPlayedTipLine(2));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    // Distinct from peer career tips (Record · / Streak · / Win rate ·).
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 2');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toBe('Win rate · 100%');
    expect(lobbyWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
  });

  it('localizes Played middot for pt-BR and es; stays distinct from Record / Streak / Win rate / Plays', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Jogadas · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).toBe(endGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(pauseGamesPlayedTipLine(2));
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Taxa \u00b7 /);

    setLocale('es');
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Jugadas · 2');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).toBe(endGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(pauseGamesPlayedTipLine(2));
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(lobbyGamesPlayedTipLine()).not.toBe(lobbyWinRateTipLine());
    expect(lobbyWinRateTipLine()).toBe(t('lobby.winRateTip', { n: 100 }));
    expect(lobbyWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    setLocale('en-GB');
  });
});
