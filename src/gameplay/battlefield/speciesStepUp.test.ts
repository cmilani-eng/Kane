import { describe, expect, it } from 'vitest';
import { nextSpeciesAfterCatalog } from './speciesStepUp';

describe('species step up', () => {
  it('offers the next species on the first map after a Hard win on the last map', () => {
    expect(nextSpeciesAfterCatalog(true, 'hard', 'gap', 'brutes')).toEqual({
      species: 'nobles',
      mapId: 'crossing',
    });
    expect(nextSpeciesAfterCatalog(true, 'hard', 'gap', 'nobles')).toEqual({
      species: 'weirdos',
      mapId: 'crossing',
    });
    expect(nextSpeciesAfterCatalog(true, 'hard', 'gap', 'weirdos')).toEqual({
      species: 'brutes',
      mapId: 'crossing',
    });
  });

  it('leaves earlier maps and lower difficulties to the other offers', () => {
    expect(nextSpeciesAfterCatalog(true, 'hard', 'crossing', 'brutes')).toBeNull();
    expect(nextSpeciesAfterCatalog(true, 'hard', 'ridge', 'nobles')).toBeNull();
    expect(nextSpeciesAfterCatalog(false, 'hard', 'gap', 'brutes')).toBeNull();
    expect(nextSpeciesAfterCatalog(true, 'normal', 'gap', 'brutes')).toBeNull();
  });
});
