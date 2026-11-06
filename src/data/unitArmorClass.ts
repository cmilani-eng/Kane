/**
 * Glanceable unit armor / role class for selection HUD.
 * Labels only — mirrors GDD Role column; does not change combat math.
 */
import type { UnitTypeId } from './units';
import { getUnitType } from './units';

export type UnitArmorClassId =
  | 'worker'
  | 'infantry'
  | 'heavy'
  | 'ranged'
  | 'cavalry'
  | 'siege'
  | 'flying'
  | 'control'
  | 'hero';

const BY_TYPE: Record<UnitTypeId, UnitArmorClassId> = {
  scavenger: 'worker',
  bonker: 'infantry',
  rock_thrower: 'ranged',
  big_bonker: 'heavy',
  wolf_rider: 'cavalry',
  stomper: 'siege',
  boom_goblin: 'siege',
  gruk: 'hero',
  serf: 'worker',
  tin_knight: 'infantry',
  bolt_boy: 'ranged',
  hammer_dwarf: 'heavy',
  boar_knight: 'cavalry',
  walking_tank: 'heavy',
  boom_cart: 'siege',
  boniface: 'hero',
  goo_worker: 'worker',
  bloblet: 'infantry',
  eyebat: 'flying',
  shroom_mage: 'ranged',
  floaty: 'flying',
  grabber: 'control',
  crystal_freak: 'siege',
  zoggle: 'hero',
};

/** Armor / role class for a unit type (GDD Role, for HUD only). */
export function unitArmorClass(typeId: UnitTypeId): UnitArmorClassId {
  return BY_TYPE[typeId] ?? (getUnitType(typeId).isHero ? 'hero' : 'infantry');
}
