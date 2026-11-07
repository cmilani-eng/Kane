import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import {
  lobbySpeciesPlaysCount,
  lobbySpeciesPlaysTipLine,
} from './lobbySpeciesPlaysTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
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

describe('lobbySpeciesPlaysTipLine', () => {
  it('returns null before any finished species plays', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbySpeciesPlaysCount()).toBeNull();
    expect(lobbySpeciesPlaysTipLine()).toBeNull();
  });

  it('labels Plays · n with middot, distinct from Played · / Wins · / Streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    // Favorite is brutes with 2 plays; total Played is 3; Wins is 2; Streak is 1.
    expect(lobbySpeciesPlaysCount()).toBe(2);
    expect(lobbySpeciesPlaysTipLine()).toBe(
      t('lobby.speciesPlaysTip', { n: 2 }),
    );
    expect(lobbySpeciesPlaysTipLine()).toBe('Plays · 2');
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Plays \u00b7 /);
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(lobbySpeciesPlaysTipLine()).toBe(pauseSpeciesPlaysTipLine(2));
    expect(pauseSpeciesPlaysTipLine(2)).toBe(
      t('pause.speciesPlaysTip', { n: 2 }),
    );
    // Distinct from peer career tips (Played · / Wins · / Streak ·).
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 3 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Played · 3');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 2');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 1');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    // Still distinct from Favorite · / Last · surfaces.
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyLastFactionTipLine());
  });

  it('localizes Plays middot for pt-BR and es; stays distinct from Played / Wins / Streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);

    setLocale('pt-BR');
    expect(lobbySpeciesPlaysTipLine()).toBe(
      t('lobby.speciesPlaysTip', { n: 2 }),
    );
    expect(lobbySpeciesPlaysTipLine()).toBe('Partidas · 2');
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).toBe(pauseSpeciesPlaysTipLine(2));
    expect(pauseSpeciesPlaysTipLine(2)).toBe(
      t('pause.speciesPlaysTip', { n: 2 }),
    );
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);

    setLocale('es');
    expect(lobbySpeciesPlaysTipLine()).toBe(
      t('lobby.speciesPlaysTip', { n: 2 }),
    );
    expect(lobbySpeciesPlaysTipLine()).toBe('Partidas · 2');
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).toBe(pauseSpeciesPlaysTipLine(2));
    expect(pauseSpeciesPlaysTipLine(2)).toBe(
      t('pause.speciesPlaysTip', { n: 2 }),
    );
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(lobbySpeciesPlaysTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    setLocale('en-GB');
  });
});
