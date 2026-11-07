/**
 * Glanceable numeric armor for selection HUD.
 * Catalog values only — mirrors GDD armor column; does not change combat math.
 */
import type { UnitTypeId } from './units';
import { unitArmorClass, type UnitArmorClassId } from './unitArmorClass';

/** Default armor by role class when a type has no override. */
const BY_CLASS: Record<UnitArmorClassId, number> = {
  worker: 0,
  infantry: 1,
  ranged: 1,
  flying: 1,
  control: 1,
  cavalry: 2,
  siege: 2,
  heavy: 3,
  hero: 3,
};

/** Optional per-type overrides (still HUD-only). */
const BY_TYPE: Partial<Record<UnitTypeId, number>> = {
  walking_tank: 4,
  stomper: 3,
  boom_cart: 1,
  boom_goblin: 0,
  grabber: 2,
  crystal_freak: 2,
};

/** Catalog armor value for a unit type (HUD label only). */
export function unitArmorValue(typeId: UnitTypeId): number {
  const override = BY_TYPE[typeId];
  if (override != null) return override;
  return BY_CLASS[unitArmorClass(typeId)];
}
