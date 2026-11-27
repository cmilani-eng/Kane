import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, speciesCopy, t } from '../../i18n';
import { endFavoriteFactionTipLine } from './endFavoriteFactionTip';
import {
  favoriteFactionId,
  lobbyFavoriteFactionTipLine,
} from './lobbyFavoriteFactionTip';
import { pauseFavoriteFactionTipLine } from './pauseFavoriteFactionTip';
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

describe('pauseFavoriteFactionTipLine', () => {
  it('is null when no favorite species id', () => {
    expect(pauseFavoriteFactionTipLine(null)).toBeNull();
    expect(pauseFavoriteFactionTipLine(undefined)).toBeNull();
  });

  it('labels Favorite · name with middot, distinct from Plays · / Wins · / Streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const id = favoriteFactionId();
    expect(id).toBe('brutes');
    const name = speciesCopy('brutes').name;
    const line = pauseFavoriteFactionTipLine(id);
    expect(line).toBe(t('pause.favoriteFactionTip', { name }));
    expect(line).toBe('Favorite · The Brutes');
    expect(line).toMatch(/^Favorite \u00b7 /);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(line).toBe(lobbyFavoriteFactionTipLine());
    expect(line).toBe(endFavoriteFactionTipLine());
    expect(endFavoriteFactionTipLine()).toBe(
      t('end.favoriteFactionTip', { name }),
    );
    // Distinct from peer career tips (Plays · / Wins · / Streak ·).
    expect(line).not.toBe(pauseSpeciesPlaysTipLine(2));
    expect(pauseSpeciesPlaysTipLine(2)).toBe(t('pause.speciesPlaysTip', { n: 2 }));
    expect(pauseSpeciesPlaysTipLine(2)).toBe('Plays · 2');
    expect(pauseSpeciesPlaysTipLine(2)).toMatch(/^Plays \u00b7 /);
    expect(line).not.toBe(pauseWinsTipLine(2, 3));
    expect(pauseWinsTipLine(2, 3)).toBe(t('pause.winsTip', { n: 2 }));
    expect(pauseWinsTipLine(2, 3)).toBe('Wins · 2');
    expect(pauseWinsTipLine(2, 3)).toMatch(/^Wins \u00b7 /);
    expect(line).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toBe(t('pause.winStreakTip', { n: 1 }));
    expect(pauseWinStreakTipLine(1)).toBe('Streak · 1');
    expect(pauseWinStreakTipLine(1)).toMatch(/^Streak \u00b7 /);
  });

  it('localizes Favorite middot for pt-BR and es; stays distinct from Plays / Wins / Streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const id = favoriteFactionId();
    expect(id).toBe('brutes');

    setLocale('pt-BR');
    const ptName = speciesCopy('brutes').name;
    const pt = pauseFavoriteFactionTipLine(id);
    expect(pt).toBe(t('pause.favoriteFactionTip', { name: ptName }));
    expect(pt).toBe('Favorita · Os Brutos');
    expect(pt).toMatch(/^Favorita \u00b7 /);
    expect(pt).toBe(lobbyFavoriteFactionTipLine());
    expect(pt).not.toBe(pauseSpeciesPlaysTipLine(2));
    expect(pauseSpeciesPlaysTipLine(2)).toMatch(/^Partidas \u00b7 /);
    expect(pt).not.toBe(pauseWinsTipLine(2, 3));
    expect(pauseWinsTipLine(2, 3)).toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Sequência \u00b7 /);

    setLocale('es');
    const esName = speciesCopy('brutes').name;
    const es = pauseFavoriteFactionTipLine(id);
    expect(es).toBe(t('pause.favoriteFactionTip', { name: esName }));
    expect(es).toBe('Favorita · Los Brutos');
    expect(es).toMatch(/^Favorita \u00b7 /);
    expect(es).toBe(lobbyFavoriteFactionTipLine());
    expect(es).not.toBe(pauseSpeciesPlaysTipLine(2));
    expect(pauseSpeciesPlaysTipLine(2)).toMatch(/^Partidas \u00b7 /);
    expect(es).not.toBe(pauseWinsTipLine(2, 3));
    expect(pauseWinsTipLine(2, 3)).toMatch(/^Victorias \u00b7 /);
    expect(es).not.toBe(pauseWinStreakTipLine(1));
    expect(pauseWinStreakTipLine(1)).toMatch(/^Racha \u00b7 /);
    setLocale('en-GB');
  });
});
