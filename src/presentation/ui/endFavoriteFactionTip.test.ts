import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, speciesCopy, t } from '../../i18n';
import { endFavoriteFactionTipLine } from './endFavoriteFactionTip';
import { endSpeciesPlaysTipLine } from './endSpeciesPlaysTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { endWinsTipLine } from './endWinsTip';
import {
  favoriteFactionId,
  lobbyFavoriteFactionTipLine,
} from './lobbyFavoriteFactionTip';
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

describe('endFavoriteFactionTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(favoriteFactionId()).toBeNull();
    expect(endFavoriteFactionTipLine()).toBeNull();
  });

  it('labels Favorite · name with middot, distinct from Plays · / Wins · / Streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const id = favoriteFactionId();
    expect(id).toBe('brutes');
    const name = speciesCopy('brutes').name;
    const line = endFavoriteFactionTipLine();
    expect(line).toBe(t('end.favoriteFactionTip', { name }));
    expect(line).toBe('Favorite · The Brutes');
    expect(line).toMatch(/^Favorite \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(line).toBe(lobbyFavoriteFactionTipLine());
    expect(line).toBe(pauseFavoriteFactionTipLine(id));
    expect(lobbyFavoriteFactionTipLine()).toBe(
      t('lobby.favoriteFactionTip', { name }),
    );
    // Distinct from peer career tips (Plays · / Wins · / Streak ·).
    expect(line).not.toBe(endSpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toBe(t('end.speciesPlaysTip', { n: 2 }));
    expect(endSpeciesPlaysTipLine()).toBe('Plays · 2');
    expect(endSpeciesPlaysTipLine()).toMatch(/^Plays \u00b7 /);
    expect(line).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toBe(t('end.winsTip', { n: 2 }));
    expect(endWinsTipLine()).toBe('Wins · 2');
    expect(endWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(line).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 1 }));
    expect(endWinStreakTipLine()).toBe('Streak · 1');
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
  });

  it('localizes Favorite middot for pt-BR and es; stays distinct from Plays / Wins / Streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const id = favoriteFactionId();
    expect(id).toBe('brutes');

    setLocale('pt-BR');
    const ptName = speciesCopy('brutes').name;
    const pt = endFavoriteFactionTipLine();
    expect(pt).toBe(t('end.favoriteFactionTip', { name: ptName }));
    expect(pt).toBe('Favorita · Os Brutos');
    expect(pt).toMatch(/^Favorita \u00b7 /);
    expect(pt).toBe(lobbyFavoriteFactionTipLine());
    expect(pt).not.toBe(endSpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(pt).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);

    setLocale('es');
    const esName = speciesCopy('brutes').name;
    const es = endFavoriteFactionTipLine();
    expect(es).toBe(t('end.favoriteFactionTip', { name: esName }));
    expect(es).toBe('Favorita · Los Brutos');
    expect(es).toMatch(/^Favorita \u00b7 /);
    expect(es).toBe(lobbyFavoriteFactionTipLine());
    expect(es).not.toBe(endSpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(es).not.toBe(endWinsTipLine());
    expect(endWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(es).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    setLocale('en-GB');
  });
});
