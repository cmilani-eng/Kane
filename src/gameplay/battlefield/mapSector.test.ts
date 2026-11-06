import { describe, expect, it } from 'vitest';
import { mapSectorAt } from './mapSector';

describe('mapSectorAt', () => {
  it('labels the nine map sectors from world coordinates', () => {
    expect(mapSectorAt(100, 100, 2400, 1600)).toBe('NW');
    expect(mapSectorAt(1200, 100, 2400, 1600)).toBe('N');
    expect(mapSectorAt(2300, 100, 2400, 1600)).toBe('NE');
    expect(mapSectorAt(100, 800, 2400, 1600)).toBe('W');
    expect(mapSectorAt(1200, 800, 2400, 1600)).toBe('C');
    expect(mapSectorAt(2300, 800, 2400, 1600)).toBe('E');
    expect(mapSectorAt(100, 1500, 2400, 1600)).toBe('SW');
    expect(mapSectorAt(1200, 1500, 2400, 1600)).toBe('S');
    expect(mapSectorAt(2300, 1500, 2400, 1600)).toBe('SE');
  });
});
