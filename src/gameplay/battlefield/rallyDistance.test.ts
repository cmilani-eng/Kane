import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rallyDistanceTiles } from './rallyDistance';

describe('rallyDistanceTiles', () => {
  it('rounds pixel span to map tiles', () => {
    expect(
      rallyDistanceTiles({
        x: 100,
        y: 100,
        rallyX: 100,
        rallyY: 100 + MAP.tile * 3,
      }),
    ).toBe(3);
    expect(
      rallyDistanceTiles({
        x: 0,
        y: 0,
        rallyX: MAP.tile * 2.4,
        rallyY: 0,
      }),
    ).toBe(2);
  });
});
