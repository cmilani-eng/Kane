/**
 * Minimap double-tap focus — selection centroid or last order ping.
 */
import { groupCenter } from './battlefieldGroupFocus';
import {
  selectedUnits,
  type BattlefieldBuilding,
  type BattlefieldWorld,
} from './battlefieldWorld';

export const MINIMAP_DOUBLE_TAP_MS = 350;

/** Prefer living selection; else newest waypoint / order ping. */
export function selectionOrOrderFocus(
  world: BattlefieldWorld,
  selectedBuilding: BattlefieldBuilding | null = null,
): { x: number; y: number } | null {
  const units = selectedUnits(world).filter((u) => u.hp > 0);
  if (units.length > 0) {
    return groupCenter(
      world,
      units.map((u) => u.id),
    );
  }

  if (selectedBuilding && selectedBuilding.hp > 0) {
    return { x: selectedBuilding.x, y: selectedBuilding.y };
  }

  const markers = world.waypointMarkers ?? [];
  for (let i = markers.length - 1; i >= 0; i--) {
    const m = markers[i]!;
    if (m.fading && m.lifeMs <= 0) continue;
    return { x: m.x, y: m.y };
  }

  return null;
}
