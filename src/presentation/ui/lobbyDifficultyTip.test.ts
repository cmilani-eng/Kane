import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, mapCopy, setLocale, speciesName, t } from '../../i18n';
import { endDifficultyPlayedTipLine } from './endDifficultyPlayedTip';
import { lobbyLastDifficultyTipLine } from './lobbyLastDifficultyTip';
import { lobbyDifficultyTipLine, lobbySetupLine } from './lobbyPanel';
import {
  missionStateForDifficulty,
  pauseObjectiveTipLine,
} from './missionObjective';
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

describe('lobbyDifficultyTipLine', () => {
  it('labels {label} · {blurb} with middot, distinct from Last difficulty · / end Difficulty · / setup / pause twin / Objective · / Map · / motto', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing');
    const d = difficultyCopy('hard');
    const tip = lobbyDifficultyTipLine();
    expect(tip).toBe(t('lobby.difficultyTip', { label: d.label, blurb: d.blurb }));
    expect(tip).toBe('Hard · Fast eco · early aggression');
    expect(tip).toMatch(/^Hard \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(d.label);
    expect(tip).toContain(d.blurb);

    // Same en copy as pause selected tip; distinct i18n key / surface.
    expect(tip).toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toBe(
      t('pause.difficultyTip', { label: d.label, blurb: d.blurb }),
    );
    expect(pauseDifficultyTipLine('hard')).toBe(
      'Hard · Fast eco · early aggression',
    );
    expect(pauseDifficultyTipLine('hard')).toMatch(/^Hard \u00b7 /);
    expect(t('lobby.difficultyTip', { label: d.label, blurb: d.blurb })).toBe(
      t('pause.difficultyTip', { label: d.label, blurb: d.blurb }),
    );

    // Distinct from Last difficulty · label peer.
    expect(tip).not.toBe(lobbyLastDifficultyTipLine());
    expect(lobbyLastDifficultyTipLine()).toBe('Last difficulty · Hard');
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Last difficulty \u00b7 /);

    // End tip uses double-spaced middot + Difficulty prefix; distinct key/surface.
    expect(tip).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label: d.label }),
    );
    expect(endDifficultyPlayedTipLine('hard')).toBe('Difficulty  ·  Hard');
    expect(endDifficultyPlayedTipLine('hard')).toContain('  ·  ');

    // Distinct from setup line (double-spaced middots) and sibling chrome tips.
    const setup = lobbySetupLine();
    expect(tip).not.toBe(setup);
    expect(setup).toBe(
      t('pause.setup', {
        species: speciesName('weirdos'),
        map: mapCopy('crossing').label,
        difficulty: d.label,
      }),
    );
    expect(setup).toContain('  ·  ');
    expect(tip).not.toBe(pauseObjectiveTipLine(missionStateForDifficulty('hard')));
    expect(pauseObjectiveTipLine(missionStateForDifficulty('hard'))).toMatch(
      /^Objective \u00b7 /,
    );
    expect(tip).not.toBe(pauseMapTipLine('crossing'));
    expect(pauseMapTipLine('crossing')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toBe(pauseSpeciesMottoTipLine('weirdos'));
    expect(pauseSpeciesMottoTipLine('weirdos')).toMatch(/ \u00b7 /);

    expect(tip).not.toMatch(/^Last difficulty \u00b7 /);
    expect(tip).not.toMatch(/^Difficulty/);
    expect(tip).not.toMatch(/^Objective \u00b7 /);
    expect(tip).not.toMatch(/^Map \u00b7 /);
    expect(tip).not.toContain('  ·  ');
  });

  it('localizes label · blurb middot for pt-BR and es; stays distinct from Last difficulty / end / Objective / Map', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing');

    setLocale('pt-BR');
    const ptD = difficultyCopy('hard');
    const pt = lobbyDifficultyTipLine();
    expect(pt).toBe(
      t('lobby.difficultyTip', { label: ptD.label, blurb: ptD.blurb }),
    );
    expect(pt).toBe('Difícil · Eco rápida · ataque cedo');
    expect(pt).toMatch(/^Difícil \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).toBe(pauseDifficultyTipLine('hard'));
    expect(pt).not.toBe(lobbyLastDifficultyTipLine());
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Última dificuldade \u00b7 /);
    expect(pt).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label: ptD.label }),
    );
    expect(endDifficultyPlayedTipLine('hard')).toContain('  ·  ');
    expect(pt).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('hard')),
    );
    expect(pauseObjectiveTipLine(missionStateForDifficulty('hard'))).toMatch(
      /^Objetivo \u00b7 /,
    );
    expect(pt).not.toBe(pauseMapTipLine('crossing'));
    expect(pauseMapTipLine('crossing')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toMatch(/^Última dificuldade \u00b7 /);
    expect(pt).not.toMatch(/^Dificuldade/);
    expect(pt).not.toMatch(/^Objetivo \u00b7 /);
    expect(pt).not.toContain('  ·  ');

    setLocale('es');
    const esD = difficultyCopy('hard');
    const es = lobbyDifficultyTipLine();
    expect(es).toBe(
      t('lobby.difficultyTip', { label: esD.label, blurb: esD.blurb }),
    );
    expect(es).toBe('Difícil · Eco rápida · ataque pronto');
    expect(es).toMatch(/^Difícil \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).toBe(pauseDifficultyTipLine('hard'));
    expect(es).not.toBe(lobbyLastDifficultyTipLine());
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Última dificultad \u00b7 /);
    expect(es).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label: esD.label }),
    );
    expect(endDifficultyPlayedTipLine('hard')).toContain('  ·  ');
    expect(es).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('hard')),
    );
    expect(pauseObjectiveTipLine(missionStateForDifficulty('hard'))).toMatch(
      /^Objetivo \u00b7 /,
    );
    expect(es).not.toBe(pauseMapTipLine('crossing'));
    expect(pauseMapTipLine('crossing')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toMatch(/^Última dificultad \u00b7 /);
    expect(es).not.toMatch(/^Dificultad/);
    expect(es).not.toMatch(/^Objetivo \u00b7 /);
    expect(es).not.toContain('  ·  ');
    setLocale('en-GB');
  });
});
