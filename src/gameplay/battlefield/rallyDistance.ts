/**
 * Rally point distance from its producer — HUD / marker label only.
 */
import { MAP } from '../../config/balance';
import { dist } from '../math';
import type { BattlefieldBuilding } from './battlefieldWorld';

/** Distance from building center to rally, in map tiles (rounded). */
export function rallyDistanceTiles(b: {
  x: number;
  y: number;
  rallyX: number;
  rallyY: number;
}): number {
  return Math.max(
    0,
    Math.round(dist(b.x, b.y, b.rallyX, b.rallyY) / MAP.tile),
  );
}

export function rallyDistanceTilesFor(
  building: BattlefieldBuilding,
): number {
  return rallyDistanceTiles(building);
}
