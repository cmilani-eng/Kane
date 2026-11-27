import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbySpeciesPlaysTipLine } from './lobbySpeciesPlaysTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';
import { pauseSpeciesPlaysTipLine } from './pauseSpeciesPlaysTip';
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

describe('pauseSpeciesPlaysTipLine', () => {
  it('is null when plays is not positive', () => {
    expect(pauseSpeciesPlaysTipLine(0)).toBeNull();
    expect(pauseSpeciesPlaysTipLine(-1)).toBeNull();
  });

  it('labels Plays · n with middot, distinct from Played · / Wins · / Streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    // Favorite species (brutes) has 2 plays; total Played is 3; Wins is 2.
    expect(pauseSpeciesPlaysTipLine(2)).toBe(t('pause.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).toBe('Plays · 2');
    expect(pauseSpeciesPlaysTipLine(2)).toMatch(/^Plays \u00b7 /);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(pauseSpeciesPlaysTipLine(2)).toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 2 }));
    // Distinct from peer career tips (Played · / Wins · / Streak ·).
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseGamesPlayedTipLine(3));
    expect(pauseGamesPlayedTipLine(3)).toBe(t('pause.gamesPlayedTip', { n: 3 }));
    expect(pauseGamesPlayedTipLine(3)).toBe('Played · 3');
    expect(pauseGamesPlayedTipLine(3)).toMatch(/^Played \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseWinsTipLine(2, 3));
    expect(pauseWinsTipLine(2, 3)).toBe(t('pause.winsTip', { n: 2 }));
    expect(pauseWinsTipLine(2, 3)).toBe('Wins · 2');
    expect(pauseWinsTipLine(2, 3)).toMatch(/^Wins \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toBe(t('pause.winStreakTip', { n: 1 }));
    expect(pauseWinStreakTipLine(1)).toBe('Streak · 1');
    expect(pauseWinStreakTipLine(1)).toMatch(/^Streak \u00b7 /);
  });

  it('localizes Plays middot for pt-BR and es; stays distinct from Played / Wins / Streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);

    setLocale('pt-BR');
    expect(pauseSpeciesPlaysTipLine(2)).toBe(t('pause.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).toBe('Partidas · 2');
    expect(pauseSpeciesPlaysTipLine(2)).toMatch(/^Partidas \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseGamesPlayedTipLine(3));
    expect(pauseGamesPlayedTipLine(3)).toMatch(/^Jogadas \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseWinsTipLine(2, 3));
    expect(pauseWinsTipLine(2, 3)).toMatch(/^Vitórias \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Sequência \u00b7 /);

    setLocale('es');
    expect(pauseSpeciesPlaysTipLine(2)).toBe(t('pause.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).toBe('Partidas · 2');
    expect(pauseSpeciesPlaysTipLine(2)).toMatch(/^Partidas \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseGamesPlayedTipLine(3));
    expect(pauseGamesPlayedTipLine(3)).toMatch(/^Jugadas \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseWinsTipLine(2, 3));
    expect(pauseWinsTipLine(2, 3)).toMatch(/^Victorias \u00b7 /);
    expect(pauseSpeciesPlaysTipLine(2)).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Racha \u00b7 /);
    setLocale('en-GB');
  });
});
