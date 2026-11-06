/**
 * Production building rally points — units march here after training.
 */
import { MAP } from '../../config/balance';
import { getBuildingType } from '../../data/buildings';
import { clamp } from '../math';
import type { BattlefieldBuilding } from './battlefieldWorld';

/** Default rally a short march south of the building. */
export function defaultRallyFor(b: {
  x: number;
  y: number;
  radius: number;
}): { rallyX: number; rallyY: number } {
  return {
    rallyX: clamp(b.x, 24, MAP.width - 24),
    rallyY: clamp(b.y + b.radius + 48, 24, MAP.height - 24),
  };
}

export function setBuildingRally(
  building: BattlefieldBuilding,
  x: number,
  y: number,
): void {
  building.rallyX = clamp(x, 24, MAP.width - 24);
  building.rallyY = clamp(y, 24, MAP.height - 24);
}

export function buildingCanRally(building: BattlefieldBuilding): boolean {
  if (building.hp <= 0) return false;
  return getBuildingType(building.typeId).trains.length > 0;
}
