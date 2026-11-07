import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import {
  resetMatchSummaries,
  writeMatchSummary,
} from '../../database/matchSummary';
import { mapCopy, resetLocaleForTests, setLocale, t } from '../../i18n';
import {
  lobbyDifficultyTipLine,
  lobbyFactionTipLine,
  lobbyMapTipLine,
  lobbyMatchLengthTipLine,
  lobbySetupLine,
  lobbyStatusLine,
} from './lobbyPanel';

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
  resetLocaleForTests();
});

describe('lobby status copy', () => {
  it('translates the join line and keeps the code', () => {
    setLocale('es');
    const line = lobbyStatusLine('joining', 'KANE01');
    expect(line).toContain('KANE01');
    expect(line).toContain('Uniéndote');
    expect(line).not.toContain('Joining');
    expect(lobbyStatusLine('blocked', null)).toBe('El código es demasiado corto');
  });

  it('surfaces the selected skirmish map label · blurb tip', () => {
    rememberMatchPrefs('nobles', 'normal', 'ridge');
    setLocale('en-GB');
    const map = mapCopy('ridge');
    expect(lobbyMapTipLine()).toBe(
      t('lobby.mapTip', { label: map.label, blurb: map.blurb }),
    );
    expect(lobbyMapTipLine()).toContain('Ridge');
    expect(lobbyMapTipLine()).toContain('Diagonal bases');
    setLocale('pt-BR');
    expect(lobbyMapTipLine()).toContain('Cume');
  });

  it('pairs species, map, and difficulty for lobby setup context', () => {
    rememberMatchPrefs('brutes', 'hard', 'gap');
    setLocale('en-GB');
    expect(lobbySetupLine()).toBe('The Brutes  ·  Gap  ·  Hard');
  });

  it('surfaces the selected faction motto as a blurb tip', () => {
    rememberMatchPrefs('weirdos', 'normal', 'crossing');
    setLocale('en-GB');
    const tip = lobbyFactionTipLine();
    expect(tip).toContain('The Weirdos');
    expect(tip).toContain('WE KNOW WHAT WE ARE DOING');
    setLocale('pt-BR');
    expect(lobbyFactionTipLine()).toContain('Os Doidos');
  });

  it('surfaces the selected difficulty label · blurb tip', () => {
    rememberMatchPrefs('nobles', 'easy', 'ridge');
    setLocale('en-GB');
    const tip = lobbyDifficultyTipLine();
    expect(tip).toBe('Easy · Newcomer cushion · slow AI eco');
    expect(tip).toMatch(/^Easy \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    setLocale('es');
    expect(lobbyDifficultyTipLine()).toMatch(/^Fácil \u00b7 /);
  });

  it('estimates match length from recent summaries, else a default tip', () => {
    setLocale('en-GB');
    resetMatchSummaries();
    expect(lobbyMatchLengthTipLine()).toContain('10');
    writeMatchSummary({
      id: 'm-a',
      version: 1,
      endedAtMs: 1,
      durationMs: 8 * 60_000,
      result: 'victory',
      won: true,
      species: 'brutes',
      difficulty: 'normal',
      playerUnitsLeft: 1,
      enemyUnitsLeft: 0,
      playerBuildingsLeft: 1,
      enemyBuildingsLeft: 0,
      sink: 'localStorage',
    });
    writeMatchSummary({
      id: 'm-b',
      version: 1,
      endedAtMs: 2,
      durationMs: 12 * 60_000,
      result: 'defeat',
      won: false,
      species: 'brutes',
      difficulty: 'normal',
      playerUnitsLeft: 0,
      enemyUnitsLeft: 1,
      playerBuildingsLeft: 0,
      enemyBuildingsLeft: 1,
      sink: 'localStorage',
    });
    expect(lobbyMatchLengthTipLine()).toContain('10');
  });
});

