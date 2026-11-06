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

/** Reset rally to the default near-building march point. */
export function clearBuildingRally(building: BattlefieldBuilding): void {
  const d = defaultRallyFor(building);
  building.rallyX = d.rallyX;
  building.rallyY = d.rallyY;
}

/** True when rally differs from the default spawn march point. */
export function buildingHasCustomRally(
  building: BattlefieldBuilding,
  slopPx = 8,
): boolean {
  const d = defaultRallyFor(building);
  const dx = building.rallyX - d.rallyX;
  const dy = building.rallyY - d.rallyY;
  return dx * dx + dy * dy > slopPx * slopPx;
}

export function buildingCanRally(building: BattlefieldBuilding): boolean {
  if (building.hp <= 0) return false;
  return getBuildingType(building.typeId).trains.length > 0;
}
