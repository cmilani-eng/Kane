import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, mapCopy, setLocale, speciesCopy, speciesName, t } from '../../i18n';
import {
  missionStateForDifficulty,
  pauseObjectiveTipLine,
} from './missionObjective';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import {
  lobbyDifficultyTipLine,
  lobbyFactionTipLine,
  lobbyMapTipLine,
  lobbySetupLine,
} from './lobbyPanel';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';
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

describe('lobbyFactionTipLine', () => {
  it('labels {name} · {blurb} with middot, distinct from Last · / Favorite · / Map · / Objective · / Difficulty · / setup', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge', 60_000, true);
    const s = speciesCopy('brutes');
    const tip = lobbyFactionTipLine();
    expect(tip).toBe(t('lobby.factionTip', { name: s.name, blurb: s.motto }));
    expect(tip).toBe('The Brutes · WHY BUILD WALL WHEN ENEMY WALL?');
    expect(tip).toMatch(/^The Brutes \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(s.name);
    expect(tip).toContain(s.motto);

    // Same en copy as pause species motto tip; distinct i18n key / surface.
    expect(tip).toBe(pauseSpeciesMottoTipLine('brutes'));
    expect(pauseSpeciesMottoTipLine('brutes')).toBe(
      t('pause.speciesMotto', { name: s.name, motto: s.motto }),
    );
    expect(pauseSpeciesMottoTipLine('brutes')).toBe(
      'The Brutes · WHY BUILD WALL WHEN ENEMY WALL?',
    );
    expect(pauseSpeciesMottoTipLine('brutes')).toMatch(/^The Brutes \u00b7 /);
    expect(t('lobby.factionTip', { name: s.name, blurb: s.motto })).toBe(
      t('pause.speciesMotto', { name: s.name, motto: s.motto }),
    );

    // Distinct from Last · name / Favorite · name peers.
    expect(tip).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe('Last · The Brutes');
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);
    expect(tip).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbyFavoriteFactionTipLine()).toBe('Favorite · The Brutes');
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorite \u00b7 /);

    // Distinct from sibling lobby/pause chrome tips and setup line (double-spaced).
    expect(tip).not.toBe(lobbyMapTipLine());
    expect(lobbyMapTipLine()).toMatch(/^Ridge \u00b7 /);
    expect(tip).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    );
    expect(pauseObjectiveTipLine(missionStateForDifficulty('normal'))).toMatch(
      /^Objective \u00b7 /,
    );
    const d = difficultyCopy('normal');
    expect(tip).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toMatch(new RegExp(`^${d.label} \\u00b7 `));
    expect(tip).not.toBe(pauseDifficultyTipLine('normal'));
    expect(pauseDifficultyTipLine('normal')).toMatch(
      new RegExp(`^${d.label} \\u00b7 `),
    );

    const setup = lobbySetupLine();
    expect(tip).not.toBe(setup);
    expect(setup).toBe(
      t('pause.setup', {
        species: speciesName('brutes'),
        map: mapCopy('ridge').label,
        difficulty: d.label,
      }),
    );
    expect(setup).toContain('  ·  ');

    expect(tip).not.toMatch(/^Last \u00b7 /);
    expect(tip).not.toMatch(/^Favorite \u00b7 /);
    expect(tip).not.toMatch(/^Map \u00b7 /);
    expect(tip).not.toMatch(/^Objective \u00b7 /);
    expect(tip).not.toContain('  ·  ');
  });

  it('localizes name · blurb middot for pt-BR and es; stays distinct from Last / Favorite / Map / Objective', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const ptS = speciesCopy('brutes');
    const pt = lobbyFactionTipLine();
    expect(pt).toBe(t('lobby.factionTip', { name: ptS.name, blurb: ptS.motto }));
    expect(pt).toBe('Os Brutos · PRA QUE MURO SE O INIMIGO TEM MURO?');
    expect(pt).toMatch(/^Os Brutos \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).toBe(pauseSpeciesMottoTipLine('brutes'));
    expect(pt).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(pt).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorita \u00b7 /);
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
    const es = lobbyFactionTipLine();
    expect(es).toBe(t('lobby.factionTip', { name: esS.name, blurb: esS.motto }));
    expect(es).toBe('Los Brutos · ¿PA QUÉ MURO SI EL ENEMIGO TIENE MURO?');
    expect(es).toMatch(/^Los Brutos \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).toBe(pauseSpeciesMottoTipLine('brutes'));
    expect(es).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(es).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorita \u00b7 /);
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
