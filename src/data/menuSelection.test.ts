import { describe, expect, it } from 'vitest';
import { AI_DIFFICULTY_ORDER } from '../gameplay/battlefield/aiDifficulty';
import {
  isMenuSelection,
  MENU_DEFAULT_SELECTION,
  toBattlefieldStartData,
} from './menuSelection';
import { SKIRMISH_MAP_ORDER } from './skirmishMaps';
import { SPECIES } from './speciesStub';

describe('menu selection contract', () => {
  it('starts on the same choice as the Phaser menu', () => {
    expect(MENU_DEFAULT_SELECTION).toEqual({ species: 'nobles', difficulty: 'normal', mapId: 'crossing' });
    expect(isMenuSelection(MENU_DEFAULT_SELECTION)).toBe(true);
  });

  it('hands the match exactly the three fields the Battlefield scene reads', () => {
    const selection = { species: 'brutes', difficulty: 'hard', mapId: 'gap' } as const;
    expect(toBattlefieldStartData(selection)).toEqual({
      species: 'brutes',
      difficulty: 'hard',
      mapId: 'gap',
    });
  });

  it('copies the selection, so later menu edits cannot change a started match', () => {
    const selection = { ...MENU_DEFAULT_SELECTION };
    const start = toBattlefieldStartData(selection);
    selection.difficulty = 'practice';
    expect(start.difficulty).toBe('normal');
  });

  it('accepts every species, difficulty and map the menu offers', () => {
    for (const species of Object.keys(SPECIES)) {
      for (const difficulty of AI_DIFFICULTY_ORDER) {
        for (const mapId of SKIRMISH_MAP_ORDER) {
          expect(isMenuSelection({ species, difficulty, mapId })).toBe(true);
        }
      }
    }
  });

  it.each([
    ['an unknown species', { species: 'dragons', difficulty: 'normal', mapId: 'crossing' }],
    ['an unknown difficulty', { species: 'nobles', difficulty: 'insane', mapId: 'crossing' }],
    ['an unknown map', { species: 'nobles', difficulty: 'normal', mapId: 'moon' }],
    ['a missing field', { species: 'nobles', difficulty: 'normal' }],
    ['null', null],
    ['a string', 'nobles'],
  ])('rejects %s', (_label, value) => {
    expect(isMenuSelection(value)).toBe(false);
  });
});
