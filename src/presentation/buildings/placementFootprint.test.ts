import { describe, expect, it } from 'vitest';
import { placeableBuildings } from '../../data/buildings';
import { placementFootprintSize } from './placementGhost';

describe('placementFootprintSize', () => {
  it('reports a positive tile footprint for every placeable building', () => {
    for (const typeId of placeableBuildings('nobles')) {
      const fp = placementFootprintSize(typeId);
      expect(fp.cols).toBeGreaterThanOrEqual(1);
      expect(fp.rows).toBeGreaterThanOrEqual(1);
    }
  });
});
