import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from './battlefieldWorld';
import { rematchPrefsFromWorld } from './rematchPrefs';

describe('rematchPrefsFromWorld', () => {
  it('restores species, difficulty, and selected map', () => {
    const world = createBattlefieldWorld('nobles', 'easy', 'ridge');
    expect(rematchPrefsFromWorld(world)).toEqual({
      species: 'nobles',
      difficulty: 'easy',
      mapId: 'ridge',
    });
  });
});
