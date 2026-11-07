import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, setLocale, t } from '../../i18n';
import { endFavoriteFactionTipLine } from './endFavoriteFactionTip';
import {
  favoriteFactionId,
  lobbyFavoriteFactionTipLine,
} from './lobbyFavoriteFactionTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbySpeciesPlaysTipLine } from './lobbySpeciesPlaysTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
import { pauseFavoriteFactionTipLine } from './pauseFavoriteFactionTip';

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

describe('lobbyFavoriteFactionTipLine', () => {
  it('returns null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(favoriteFactionId()).toBeNull();
    expect(lobbyFavoriteFactionTipLine()).toBeNull();
  });

  it('labels Favorite · name with middot, distinct from Plays · / Wins · / Streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const id = favoriteFactionId();
    expect(id).toBe('brutes');
    const name = speciesCopy('brutes').name;
    const line = lobbyFavoriteFactionTipLine();
    expect(line).toBe(t('lobby.favoriteFactionTip', { name }));
    expect(line).toBe('Favorite · The Brutes');
    expect(line).toMatch(/^Favorite \u00b7 /);
    expect(line).not.toBe(lobbyLastFactionTipLine());
    // Same en copy as pause/end tips; distinct i18n key / surface.
    expect(line).toBe(pauseFavoriteFactionTipLine(id));
    expect(line).toBe(endFavoriteFactionTipLine());
    expect(endFavoriteFactionTipLine()).toBe(
      t('end.favoriteFactionTip', { name }),
    );
    // Distinct from peer career tips (Plays · / Wins · / Streak ·).
    expect(line).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toBe(t('lobby.speciesPlaysTip', { n: 2 }));
    expect(lobbySpeciesPlaysTipLine()).toBe('Plays · 2');
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Plays \u00b7 /);
    expect(line).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 2');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(line).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 1');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
  });

  it('localizes Favorite middot for pt-BR and es; stays distinct from Plays / Wins / Streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const id = favoriteFactionId();
    expect(id).toBe('brutes');

    setLocale('pt-BR');
    const ptName = speciesCopy('brutes').name;
    const pt = lobbyFavoriteFactionTipLine();
    expect(pt).toBe(t('lobby.favoriteFactionTip', { name: ptName }));
    expect(pt).toBe('Favorita · Os Brutos');
    expect(pt).toMatch(/^Favorita \u00b7 /);
    expect(pt).toBe(pauseFavoriteFactionTipLine(id));
    expect(pt).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(pt).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);

    setLocale('es');
    const esName = speciesCopy('brutes').name;
    const es = lobbyFavoriteFactionTipLine();
    expect(es).toBe(t('lobby.favoriteFactionTip', { name: esName }));
    expect(es).toBe('Favorita · Los Brutos');
    expect(es).toMatch(/^Favorita \u00b7 /);
    expect(es).toBe(pauseFavoriteFactionTipLine(id));
    expect(es).not.toBe(lobbySpeciesPlaysTipLine());
    expect(lobbySpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(es).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(es).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    setLocale('en-GB');
  });
});
