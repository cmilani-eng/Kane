import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  defaultMatchPrefs,
  loadMatchPrefs,
  rememberMatchPrefs,
  saveMatchPrefs,
} from './matchPrefs';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
});

afterEach(() => {
  store.clear();
});

describe('match prefs rematch restore', () => {
  it('keeps Practice for rematch', () => {
    rememberMatchPrefs('brutes', 'practice', 'crossing');
    expect(loadMatchPrefs().difficulty).toBe('practice');
  });

  it('persists species, difficulty, and map for rematch / menu restore', () => {
    rememberMatchPrefs('weirdos', 'hard', 'ridge');
    const prefs = loadMatchPrefs();
    expect(prefs.species).toBe('weirdos');
    expect(prefs.difficulty).toBe('hard');
    expect(prefs.mapId).toBe('ridge');
  });

  it('persists last match duration and keeps it when omitted on later remember', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 125_000);
    expect(loadMatchPrefs().lastDurationMs).toBe(125_000);
    rememberMatchPrefs('brutes', 'easy', 'ridge');
    expect(loadMatchPrefs().lastDurationMs).toBe(125_000);
    expect(loadMatchPrefs().species).toBe('brutes');
  });

  it('persists last match outcome and keeps it when omitted on later remember', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(loadMatchPrefs().lastWon).toBe(true);
    rememberMatchPrefs('brutes', 'hard', 'ridge', 60_000, false);
    expect(loadMatchPrefs().lastWon).toBe(false);
    rememberMatchPrefs('weirdos', 'easy', 'gap');
    expect(loadMatchPrefs().lastWon).toBe(false);
  });

  it('tallies win streak on wins and clears on loss', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(loadMatchPrefs().winStreak).toBe(1);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(loadMatchPrefs().winStreak).toBe(2);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(loadMatchPrefs().winStreak).toBe(0);
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(loadMatchPrefs().winStreak).toBe(0);
  });

  it('tracks peak win streak as bestWinStreak across losses', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(loadMatchPrefs().bestWinStreak).toBe(1);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(loadMatchPrefs().bestWinStreak).toBe(2);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, false);
    expect(loadMatchPrefs().bestWinStreak).toBe(2);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, true);
    expect(loadMatchPrefs().winStreak).toBe(1);
    expect(loadMatchPrefs().bestWinStreak).toBe(2);
  });

  it('tracks shortest winning match duration as best', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 120_000, true);
    expect(loadMatchPrefs().bestDurationMs).toBe(120_000);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 90_000, true);
    expect(loadMatchPrefs().bestDurationMs).toBe(90_000);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 150_000, true);
    expect(loadMatchPrefs().bestDurationMs).toBe(90_000);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, false);
    expect(loadMatchPrefs().bestDurationMs).toBe(90_000);
  });

  it('counts finished matches as gamesPlayed when outcome is set', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(loadMatchPrefs().gamesPlayed).toBe(1);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(loadMatchPrefs().gamesPlayed).toBe(2);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(loadMatchPrefs().gamesPlayed).toBe(2);
  });

  it('tallies gamesWon on wins only', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(loadMatchPrefs().gamesWon).toBe(1);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(loadMatchPrefs().gamesWon).toBe(1);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 70_000, true);
    expect(loadMatchPrefs().gamesWon).toBe(2);
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(loadMatchPrefs().gamesWon).toBe(2);
  });

  it('tallies finished matches per species in speciesPlays', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    expect(loadMatchPrefs().speciesPlays?.nobles).toBe(1);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(loadMatchPrefs().speciesPlays?.brutes).toBe(1);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    expect(loadMatchPrefs().speciesPlays?.brutes).toBe(2);
    rememberMatchPrefs('weirdos', 'easy', 'crossing');
    expect(loadMatchPrefs().speciesPlays?.brutes).toBe(2);
    expect(loadMatchPrefs().speciesPlays?.nobles).toBe(1);
  });

  it('defaults map to crossing when older prefs omit mapId', () => {
    store.set(
      'kane.matchPrefs.v1',
      JSON.stringify({ version: 1, species: 'brutes', difficulty: 'easy' }),
    );
    const prefs = loadMatchPrefs();
    expect(prefs.species).toBe('brutes');
    expect(prefs.difficulty).toBe('easy');
    expect(prefs.mapId).toBe(defaultMatchPrefs().mapId);
  });

  it('clamps invalid map / species to defaults', () => {
    saveMatchPrefs({
      version: 1,
      // @ts-expect-error intentional bad input
      species: 'dragons',
      difficulty: 'normal',
      // @ts-expect-error intentional bad input
      mapId: 'volcano',
    });
    const prefs = loadMatchPrefs();
    expect(prefs.species).toBe('nobles');
    expect(prefs.mapId).toBe('crossing');
  });
});
