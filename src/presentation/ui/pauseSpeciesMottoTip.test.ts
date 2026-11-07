import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, mapCopy, setLocale, speciesCopy, speciesName, t } from '../../i18n';
import {
  missionStateForDifficulty,
  pauseObjectiveTipLine,
} from './missionObjective';
import { lobbyFactionTipLine } from './lobbyPanel';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';
import { pauseFavoriteFactionTipLine } from './pauseFavoriteFactionTip';
import { pauseMapTipLine } from './pauseMapTip';
import { pauseSpeciesMottoTipLine } from './pauseSpeciesMottoTip';

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

describe('pauseSpeciesMottoTipLine', () => {
  it('labels {name} · {motto} with middot, distinct from Map · / Objective · / Difficulty · / Favorite · / Last · / setup', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge');
    const s = speciesCopy('brutes');
    const tip = pauseSpeciesMottoTipLine('brutes');
    expect(tip).toBe(t('pause.speciesMotto', { name: s.name, motto: s.motto }));
    expect(tip).toBe('The Brutes · WHY BUILD WALL WHEN ENEMY WALL?');
    expect(tip).toMatch(/^The Brutes \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(s.name);
    expect(tip).toContain(s.motto);

    // Same en copy as lobby selected faction tip; distinct i18n key / surface.
    expect(tip).toBe(lobbyFactionTipLine());
    expect(lobbyFactionTipLine()).toBe(
      t('lobby.factionTip', { name: s.name, blurb: s.motto }),
    );
    expect(lobbyFactionTipLine()).toBe(
      'The Brutes · WHY BUILD WALL WHEN ENEMY WALL?',
    );
    expect(lobbyFactionTipLine()).toMatch(/^The Brutes \u00b7 /);
    expect(t('pause.speciesMotto', { name: s.name, motto: s.motto })).toBe(
      t('lobby.factionTip', { name: s.name, blurb: s.motto }),
    );

    // Distinct from Last · name / Favorite · name peers.
    expect(tip).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe('Last · The Brutes');
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);
    expect(tip).not.toBe(pauseFavoriteFactionTipLine('brutes'));
    expect(pauseFavoriteFactionTipLine('brutes')).toBe('Favorite · The Brutes');
    expect(pauseFavoriteFactionTipLine('brutes')).toMatch(/^Favorite \u00b7 /);

    // Distinct from sibling pause chrome tips and setup line (double-spaced).
    expect(tip).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    );
    expect(pauseObjectiveTipLine(missionStateForDifficulty('normal'))).toMatch(
      /^Objective \u00b7 /,
    );
    const d = difficultyCopy('normal');
    expect(tip).not.toBe(pauseDifficultyTipLine('normal'));
    expect(pauseDifficultyTipLine('normal')).toMatch(
      new RegExp(`^${d.label} \\u00b7 `),
    );

    const setup = t('pause.setup', {
      species: speciesName('brutes'),
      map: mapCopy('ridge').label,
      difficulty: d.label,
    });
    expect(tip).not.toBe(setup);
    expect(setup).toContain('  ·  ');

    expect(tip).not.toMatch(/^Map \u00b7 /);
    expect(tip).not.toMatch(/^Objective \u00b7 /);
    expect(tip).not.toMatch(/^Last \u00b7 /);
    expect(tip).not.toMatch(/^Favorite \u00b7 /);
    expect(tip).not.toContain('  ·  ');
  });

  it('localizes name · motto middot for pt-BR and es; stays distinct from lobby Last / Favorite / Map / Objective', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge');

    setLocale('pt-BR');
    const ptS = speciesCopy('brutes');
    const pt = pauseSpeciesMottoTipLine('brutes');
    expect(pt).toBe(
      t('pause.speciesMotto', { name: ptS.name, motto: ptS.motto }),
    );
    expect(pt).toBe('Os Brutos · PRA QUE MURO SE O INIMIGO TEM MURO?');
    expect(pt).toMatch(/^Os Brutos \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).toBe(lobbyFactionTipLine());
    expect(pt).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(pt).not.toBe(pauseFavoriteFactionTipLine('brutes'));
    expect(pauseFavoriteFactionTipLine('brutes')).toMatch(/^Favorita \u00b7 /);
    expect(pt).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    );
    expect(pauseObjectiveTipLine(missionStateForDifficulty('normal'))).toMatch(
      /^Objetivo \u00b7 /,
    );
    expect(pt).not.toMatch(/^Última \u00b7 /);
    expect(pt).not.toMatch(/^Favorita \u00b7 /);
    expect(pt).not.toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toMatch(/^Objetivo \u00b7 /);
    expect(pt).not.toContain('  ·  ');

    setLocale('es');
    const esS = speciesCopy('brutes');
    const es = pauseSpeciesMottoTipLine('brutes');
    expect(es).toBe(
      t('pause.speciesMotto', { name: esS.name, motto: esS.motto }),
    );
    expect(es).toBe('Los Brutos · ¿PA QUÉ MURO SI EL ENEMIGO TIENE MURO?');
    expect(es).toMatch(/^Los Brutos \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).toBe(lobbyFactionTipLine());
    expect(es).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(es).not.toBe(pauseFavoriteFactionTipLine('brutes'));
    expect(pauseFavoriteFactionTipLine('brutes')).toMatch(/^Favorita \u00b7 /);
    expect(es).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    );
    expect(pauseObjectiveTipLine(missionStateForDifficulty('normal'))).toMatch(
      /^Objetivo \u00b7 /,
    );
    expect(es).not.toMatch(/^Última \u00b7 /);
    expect(es).not.toMatch(/^Favorita \u00b7 /);
    expect(es).not.toMatch(/^Mapa \u00b7 /);
    expect(es).not.toMatch(/^Objetivo \u00b7 /);
    expect(es).not.toContain('  ·  ');
    setLocale('en-GB');
  });
});
