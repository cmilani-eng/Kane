import { describe, expect, it } from 'vitest';
import {
  buildingHasCustomRally,
  clearBuildingRally,
  defaultRallyFor,
  setBuildingRally,
} from './battlefieldRally';
import type { BattlefieldBuilding } from './battlefieldWorld';

function stubBuilding(): BattlefieldBuilding {
  const d = defaultRallyFor({ x: 200, y: 200, radius: 28 });
  return {
    x: 200,
    y: 200,
    radius: 28,
    rallyX: d.rallyX,
    rallyY: d.rallyY,
    hp: 100,
    typeId: 'barracks',
  } as BattlefieldBuilding;
}

describe('building rally clear', () => {
  it('detects custom rally and clears back to default', () => {
    const b = stubBuilding();
    expect(buildingHasCustomRally(b)).toBe(false);
    setBuildingRally(b, 400, 400);
    expect(buildingHasCustomRally(b)).toBe(true);
    clearBuildingRally(b);
    expect(buildingHasCustomRally(b)).toBe(false);
    const d = defaultRallyFor(b);
    expect(b.rallyX).toBe(d.rallyX);
    expect(b.rallyY).toBe(d.rallyY);
  });
});
