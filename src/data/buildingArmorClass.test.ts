import { describe, expect, it } from 'vitest';
import { buildingArmorClass } from './buildingArmorClass';

describe('buildingArmorClass', () => {
  it('labels buildings as structure for the selection HUD', () => {
    expect(buildingArmorClass('junkyard')).toBe('structure');
    expect(buildingArmorClass('barracks')).toBe('structure');
    expect(buildingArmorClass('watchtower')).toBe('structure');
  });
});
