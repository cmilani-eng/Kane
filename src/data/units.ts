/**
 * Data-driven unit stats (combat milestone).
 * Presentation reads colors from species; gameplay uses these numbers.
 */

export type UnitTypeId = 'bonker' | 'rock_thrower' | 'rival_grunt';

export interface UnitTypeDef {
  id: UnitTypeId;
  name: string;
  speciesId: 'brutes' | 'nobles' | 'weirdos';
  maxHp: number;
  dmg: number;
  /** Attack reach in world px (center-to-center before radii). */
  range: number;
  speed: number;
  radius: number;
  vision: number;
  attackCooldownMs: number;
}

export const UNIT_TYPES: Record<UnitTypeId, UnitTypeDef> = {
  bonker: {
    id: 'bonker',
    name: 'Bonker',
    speciesId: 'brutes',
    maxHp: 100,
    dmg: 12,
    range: 36,
    speed: 105,
    radius: 14,
    vision: 260,
    attackCooldownMs: 700,
  },
  rock_thrower: {
    id: 'rock_thrower',
    name: 'Rock Thrower',
    speciesId: 'brutes',
    maxHp: 70,
    dmg: 9,
    range: 130,
    speed: 90,
    radius: 12,
    vision: 280,
    attackCooldownMs: 850,
  },
  rival_grunt: {
    id: 'rival_grunt',
    name: 'Rival Grunt',
    speciesId: 'nobles',
    maxHp: 85,
    dmg: 10,
    range: 40,
    speed: 95,
    radius: 13,
    vision: 240,
    attackCooldownMs: 750,
  },
};

export function getUnitType(id: UnitTypeId): UnitTypeDef {
  return UNIT_TYPES[id];
}
