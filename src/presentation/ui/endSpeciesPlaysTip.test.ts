import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endSpeciesPlaysTipLine } from './endSpeciesPlaysTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { endWinsTipLine } from './endWinsTip';
import { lobbySpeciesPlaysTipLine } from './lobbySpeciesPlaysTip';
import { pauseSpeciesPlaysTipLine } from './pauseSpeciesPlaysTip';

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

describe('endSpeciesPlaysTipLine', () => {
  it('returns null before any finished species plays', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endSpeciesPlaysTipLine()).toBeNull();
  });

  it('labels Plays · n with middot, distinct from Played · / Wins · / Streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    // Favorite is brutes with 2 plays; total Played is 3; Wins is 2; Streak is 1.
    expect(endSpeciesPlaysTipLine()).toBe(t('end.speciesPlaysTip', { n: 2 }));
    expect(endSpeciesPlaysTipLine()).toBe('Plays · 2');
    expect(endSpeciesPlaysTipLine()).toMatch(/^Plays \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endSpeciesPlaysTipLine()).toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 2 }));
    expect(endSpeciesPlaysTipLine()).toBe(pauseSpeciesPlaysTipLine(2));
    expect(pauseSpeciesPlaysTipLine(2)).toBe(t('pause.speciesPlaysTip', { n: 2 }));
    // Distinct from peer career tips (Played · / Wins · / Streak ·).
    expect(endSpeciesPlaysTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 3 }));
    expect(endGamesPlayedTipLine()).toBe('Played · 3');
    expect(endGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(endSpeciesPlaysTipLine()).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe('Wins · 2');
    expect(endWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(endSpeciesPlaysTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 1 }));
    expect(endWinStreakTipLine()).toBe('Streak · 1');
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
  });

  it('localizes Plays middot for pt-BR and es; stays distinct from Played / Wins / Streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);

    setLocale('pt-BR');
    expect(endSpeciesPlaysTipLine()).toBe(t('end.speciesPlaysTip', { n: 2 }));
    expect(endSpeciesPlaysTipLine()).toBe('Partidas · 2');
    expect(endSpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(endSpeciesPlaysTipLine()).toBe(lobbySpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toBe(pauseSpeciesPlaysTipLine(2));
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).toBe(t('pause.speciesPlaysTip', { n: 2 }));
    expect(endSpeciesPlaysTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(endSpeciesPlaysTipLine()).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(endSpeciesPlaysTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);

    setLocale('es');
    expect(endSpeciesPlaysTipLine()).toBe(t('end.speciesPlaysTip', { n: 2 }));
    expect(endSpeciesPlaysTipLine()).toBe('Partidas · 2');
    expect(endSpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(endSpeciesPlaysTipLine()).toBe(lobbySpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toBe(pauseSpeciesPlaysTipLine(2));
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).toBe(t('pause.speciesPlaysTip', { n: 2 }));
    expect(endSpeciesPlaysTipLine()).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(endSpeciesPlaysTipLine()).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(endSpeciesPlaysTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    setLocale('en-GB');
  });
});
