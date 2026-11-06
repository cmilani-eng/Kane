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
  it('persists species, difficulty, and map for rematch / menu restore', () => {
    rememberMatchPrefs('weirdos', 'hard', 'ridge');
    const prefs = loadMatchPrefs();
    expect(prefs.species).toBe('weirdos');
    expect(prefs.difficulty).toBe('hard');
    expect(prefs.mapId).toBe('ridge');
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
