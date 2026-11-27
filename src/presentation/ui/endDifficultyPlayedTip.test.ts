import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, mapCopy, setLocale, t } from '../../i18n';
import { endDifficultyPlayedTipLine } from './endDifficultyPlayedTip';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endObjectiveResultTipLine } from './endObjectiveResultTip';
import { lobbyLastDifficultyTipLine } from './lobbyLastDifficultyTip';
import { lobbyDifficultyTipLine } from './lobbyPanel';
import { formatMatchClock } from './matchClock';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';

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

describe('endDifficultyPlayedTipLine', () => {
  it('labels Difficulty · label with middot, distinct from Last difficulty · / label · blurb / Objective · / Map · / meta', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing');
    const label = difficultyCopy('hard').label;
    const tip = endDifficultyPlayedTipLine('hard');
    expect(tip).toBe(t('end.difficultyTip', { label }));
    expect(tip).toBe('Difficulty · Hard');
    expect(tip).toMatch(/^Difficulty \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).not.toMatch(/ {2}/);
    expect(tip).toContain(label);

    // Distinct from Last difficulty · (same label payload, different prefix).
    expect(tip).not.toBe(lobbyLastDifficultyTipLine());
    expect(lobbyLastDifficultyTipLine()).toBe('Last difficulty · Hard');
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Last difficulty \u00b7 /);

    // Distinct from lobby/pause {label} · {blurb} (no Difficulty prefix).
    expect(tip).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toBe('Hard · Fast eco · early aggression');
    expect(lobbyDifficultyTipLine()).toMatch(/^Hard \u00b7 /);
    expect(tip).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toBe(
      'Hard · Fast eco · early aggression',
    );
    expect(pauseDifficultyTipLine('hard')).toMatch(/^Hard \u00b7 /);

    // Distinct from Objective · result tip / Map · name / meta line.
    expect(tip).not.toBe(endObjectiveResultTipLine(true, 'keep'));
    expect(endObjectiveResultTipLine(true, 'keep')).toBe(
      'Objective · Won · Enemy Keep destroyed',
    );
    expect(endObjectiveResultTipLine(true, 'keep')).toMatch(/^Objective \u00b7 /);
    expect(tip).not.toBe(endMapPlayedTipLine('crossing'));
    expect(endMapPlayedTipLine('crossing')).toBe('Map · Crossing');
    expect(endMapPlayedTipLine('crossing')).toMatch(/^Map \u00b7 /);
    const meta = t('end.meta', {
      map: mapCopy('crossing').label,
      difficulty: label,
      clock: formatMatchClock(125_000),
    });
    expect(tip).not.toBe(meta);
    expect(meta).toContain('  ·  ');
    expect(meta).toContain(label);

    expect(tip).not.toMatch(/^Last difficulty \u00b7 /);
    expect(tip).not.toMatch(/^Hard \u00b7 /);
    expect(tip).not.toMatch(/^Objective \u00b7 /);
    expect(tip).not.toMatch(/^Map \u00b7 /);
    expect(tip).not.toContain('  ·  ');
  });

  it('tracks the match difficulty argument', () => {
    expect(endDifficultyPlayedTipLine('easy')).toBe('Difficulty · Easy');
    expect(endDifficultyPlayedTipLine('easy')).toMatch(/^Difficulty \u00b7 /);
    expect(endDifficultyPlayedTipLine('normal')).toBe('Difficulty · Normal');
    expect(endDifficultyPlayedTipLine('normal')).toContain(' \u00b7 ');
    expect(endDifficultyPlayedTipLine('hard')).toBe('Difficulty · Hard');
    expect(endDifficultyPlayedTipLine('easy')).not.toBe(
      endDifficultyPlayedTipLine('hard'),
    );
  });

  it('localizes Difficulty middot for pt-BR and es; stays distinct from Last difficulty / blurb / Objective / Map / meta', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing');

    setLocale('pt-BR');
    const ptLabel = difficultyCopy('hard').label;
    const pt = endDifficultyPlayedTipLine('hard');
    expect(pt).toBe(t('end.difficultyTip', { label: ptLabel }));
    expect(pt).toBe('Dificuldade · Difícil');
    expect(pt).toMatch(/^Dificuldade \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toMatch(/ {2}/);
    expect(pt).not.toBe(lobbyLastDifficultyTipLine());
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Última dificuldade \u00b7 /);
    expect(pt).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toMatch(/^Difícil \u00b7 /);
    expect(pt).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toMatch(/^Difícil \u00b7 /);
    expect(pt).not.toBe(endObjectiveResultTipLine(true, 'keep'));
    expect(endObjectiveResultTipLine(true, 'keep')).toMatch(/^Objetivo \u00b7 /);
    expect(pt).not.toBe(endMapPlayedTipLine('crossing'));
    expect(endMapPlayedTipLine('crossing')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(
      t('end.meta', {
        map: mapCopy('crossing').label,
        difficulty: ptLabel,
        clock: formatMatchClock(125_000),
      }),
    );
    expect(pt).not.toMatch(/^Última dificuldade \u00b7 /);
    expect(pt).not.toMatch(/^Difícil \u00b7 /);
    expect(pt).not.toMatch(/^Objetivo \u00b7 /);
    expect(pt).not.toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toContain('  ·  ');

    setLocale('es');
    const esLabel = difficultyCopy('hard').label;
    const es = endDifficultyPlayedTipLine('hard');
    expect(es).toBe(t('end.difficultyTip', { label: esLabel }));
    expect(es).toBe('Dificultad · Difícil');
    expect(es).toMatch(/^Dificultad \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toMatch(/ {2}/);
    expect(es).not.toBe(lobbyLastDifficultyTipLine());
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Última dificultad \u00b7 /);
    expect(es).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toMatch(/^Difícil \u00b7 /);
    expect(es).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toMatch(/^Difícil \u00b7 /);
    expect(es).not.toBe(endObjectiveResultTipLine(true, 'keep'));
    expect(endObjectiveResultTipLine(true, 'keep')).toMatch(/^Objetivo \u00b7 /);
    expect(es).not.toBe(endMapPlayedTipLine('crossing'));
    expect(endMapPlayedTipLine('crossing')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(
      t('end.meta', {
        map: mapCopy('crossing').label,
        difficulty: esLabel,
        clock: formatMatchClock(125_000),
      }),
    );
    expect(es).not.toMatch(/^Última dificultad \u00b7 /);
    expect(es).not.toMatch(/^Difícil \u00b7 /);
    expect(es).not.toMatch(/^Objetivo \u00b7 /);
    expect(es).not.toMatch(/^Mapa \u00b7 /);
    expect(es).not.toContain('  ·  ');
    setLocale('en-GB');
  });
});
