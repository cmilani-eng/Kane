import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, speciesName, t } from '../../i18n';
import { endFavoriteFactionTipLine } from './endFavoriteFactionTip';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endSpeciesPlayedTipLine } from './endSpeciesPlayedTip';
import { endSpeciesPlaysTipLine } from './endSpeciesPlaysTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { unitSpeciesTipLabel } from './unitSpeciesTip';

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

describe('endSpeciesPlayedTipLine', () => {
  it('labels Played · name with middot, distinct from Played · n / Plays · / Favorite · / Last · / Species ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    const name = speciesName('brutes');
    const tip = endSpeciesPlayedTipLine('brutes');
    expect(tip).toBe(t('end.speciesTip', { name }));
    expect(tip).toBe('Played · The Brutes');
    expect(tip).toMatch(/^Played \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).not.toMatch(/ {2}/);
    expect(tip).toContain(name);

    // Distinct from same-prefix career Played · n count tip.
    expect(tip).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe('Played · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(tip).not.toMatch(/^Played \u00b7 \d/);

    // Distinct from Plays · / Favorite · career peers.
    expect(tip).not.toBe(endSpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toBe('Plays · 1');
    expect(endSpeciesPlaysTipLine()).toMatch(/^Plays \u00b7 /);
    expect(tip).not.toBe(endFavoriteFactionTipLine());
    expect(endFavoriteFactionTipLine()).toBe('Favorite · The Brutes');
    expect(endFavoriteFactionTipLine()).toMatch(/^Favorite \u00b7 /);

    // Distinct from lobby Last · faction (same name payload, different label).
    expect(tip).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe('Last · The Brutes');
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);

    // Distinct from selection Species · identity tip (same name, different label).
    expect(tip).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toBe('Species · The Brutes');
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Species \u00b7 /);

    expect(tip).not.toMatch(/^Plays \u00b7 /);
    expect(tip).not.toMatch(/^Favorite \u00b7 /);
    expect(tip).not.toMatch(/^Last \u00b7 /);
    expect(tip).not.toMatch(/^Species \u00b7 /);
  });

  it('tracks the match speciesId argument', () => {
    expect(endSpeciesPlayedTipLine('nobles')).toBe('Played · The Nobles');
    expect(endSpeciesPlayedTipLine('nobles')).toMatch(/^Played \u00b7 /);
    expect(endSpeciesPlayedTipLine('weirdos')).toBe('Played · The Weirdos');
    expect(endSpeciesPlayedTipLine('weirdos')).toContain(' \u00b7 ');
    expect(endSpeciesPlayedTipLine('nobles')).not.toBe(
      endSpeciesPlayedTipLine('weirdos'),
    );
  });

  it('localizes Played · name middot for pt-BR and es; stays distinct from Played · n / Plays · / Favorite · / Last · / Species ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const ptName = speciesName('brutes');
    const pt = endSpeciesPlayedTipLine('brutes');
    expect(pt).toBe(t('end.speciesTip', { name: ptName }));
    expect(pt).toBe('Jogou · Os Brutos');
    expect(pt).toMatch(/^Jogou \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toMatch(/ {2}/);
    expect(pt).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe('Jogadas · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toBe(endSpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(pt).not.toBe(endFavoriteFactionTipLine());
    expect(endFavoriteFactionTipLine()).toBe('Favorita · Os Brutos');
    expect(endFavoriteFactionTipLine()).toMatch(/^Favorita \u00b7 /);
    expect(pt).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe('Última · Os Brutos');
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(pt).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toBe('Espécie · Os Brutos');
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Espécie \u00b7 /);
    expect(pt).not.toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toMatch(/^Partidas \u00b7 /);
    expect(pt).not.toMatch(/^Favorita \u00b7 /);
    expect(pt).not.toMatch(/^Última \u00b7 /);
    expect(pt).not.toMatch(/^Espécie \u00b7 /);

    setLocale('es');
    const esName = speciesName('brutes');
    const es = endSpeciesPlayedTipLine('brutes');
    expect(es).toBe(t('end.speciesTip', { name: esName }));
    expect(es).toBe('Jugó · Los Brutos');
    expect(es).toMatch(/^Jugó \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toMatch(/ {2}/);
    expect(es).not.toBe(endGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe('Jugadas · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toBe(endSpeciesPlaysTipLine());
    expect(endSpeciesPlaysTipLine()).toMatch(/^Partidas \u00b7 /);
    expect(es).not.toBe(endFavoriteFactionTipLine());
    expect(endFavoriteFactionTipLine()).toBe('Favorita · Los Brutos');
    expect(endFavoriteFactionTipLine()).toMatch(/^Favorita \u00b7 /);
    expect(es).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe('Última · Los Brutos');
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(es).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toBe('Especie · Los Brutos');
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Especie \u00b7 /);
    expect(es).not.toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toMatch(/^Partidas \u00b7 /);
    expect(es).not.toMatch(/^Favorita \u00b7 /);
    expect(es).not.toMatch(/^Última \u00b7 /);
    expect(es).not.toMatch(/^Especie \u00b7 /);
    setLocale('en-GB');
  });
});
