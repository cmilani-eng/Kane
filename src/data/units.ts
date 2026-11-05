/**
 * Data-driven unit stats.
 */

export type UnitTypeId =
  | 'scavenger'
  | 'bonker'
  | 'rock_thrower'
  | 'rival_grunt'
  | 'rival_scavenger';

export interface UnitTypeDef {
  id: UnitTypeId;
  name: string;
  speciesId: 'brutes' | 'nobles' | 'weirdos';
  maxHp: number;
  dmg: number;
  range: number;
  speed: number;
  radius: number;
  vision: number;
  attackCooldownMs: number;
  canGather: boolean;
  carryCapacity: number;
  /** Train cost (production milestone). */
  costGold: number;
  costCrystals: number;
  trainMs: number;
}

export const UNIT_TYPES: Record<UnitTypeId, UnitTypeDef> = {
  scavenger: {
    id: 'scavenger',
    name: 'Scavenger',
    speciesId: 'brutes',
    maxHp: 55,
    dmg: 4,
    range: 28,
    speed: 100,
    radius: 12,
    vision: 220,
    attackCooldownMs: 900,
    canGather: true,
    carryCapacity: 10,
    costGold: 40,
    costCrystals: 0,
    trainMs: 2500,
  },
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
    canGather: false,
    carryCapacity: 0,
    costGold: 55,
    costCrystals: 0,
    trainMs: 2800,
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
    canGather: false,
    carryCapacity: 0,
    costGold: 60,
    costCrystals: 5,
    trainMs: 3200,
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
    canGather: false,
    carryCapacity: 0,
    costGold: 55,
    costCrystals: 0,
    trainMs: 2800,
  },
  rival_scavenger: {
    id: 'rival_scavenger',
    name: 'Rival Scavenger',
    speciesId: 'nobles',
    maxHp: 50,
    dmg: 3,
    range: 26,
    speed: 98,
    radius: 12,
    vision: 210,
    attackCooldownMs: 950,
    canGather: true,
    carryCapacity: 10,
    costGold: 40,
    costCrystals: 0,
    trainMs: 2500,
  },
};

export function getUnitType(id: UnitTypeId): UnitTypeDef {
  return UNIT_TYPES[id];
}
