/**
 * Glanceable splash / AoE attack radius for selection HUD.
 * Catalog values only — mirrors GDD AoE/blast units; does not change combat math.
 * Distances in world px (same as attack range); tip converts to map tiles.
 */
import type { UnitTypeId } from './units';

/**
 * World-pixel splash radius for units with area-of-effect basic attacks.
 * Omitted types have no splash tip (single-target).
 */
const BY_TYPE: Partial<Record<UnitTypeId, number>> = {
  /** Heavy trunk swings — short melee cleave. */
  big_bonker: 48,
  /** Unstable explosive blast. */
  boom_goblin: 80,
  /** Siege cannon shell splash. */
  boom_cart: 80,
  /** Crystal siege burst. */
  crystal_freak: 80,
};

/** Catalog splash radius in world px. Null when the unit has no splash attack. */
export function unitSplashRadiusPx(typeId: UnitTypeId): number | null {
  const n = BY_TYPE[typeId];
  if (n == null || n <= 0) return null;
  return n;
}
