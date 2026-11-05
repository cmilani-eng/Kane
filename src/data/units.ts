/**
 * Data-driven unit stats — Brutes + Nobles (GDD v2).
 */

export type UnitTypeId =
  // Brutes
  | 'scavenger'
  | 'bonker'
  | 'rock_thrower'
  // Nobles
  | 'serf'
  | 'tin_knight'
  | 'bolt_boy'
  | 'hammer_dwarf'
  | 'boar_knight'
  | 'walking_tank'
  | 'boom_cart';

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
  costGold: number;
  costCrystals: number;
  trainMs: number;
  /** Structure bonus damage multiplier (siege). */
  structureMult?: number;
  /** Participates in FORMATIONS when Nobles. */
  usesFormation?: boolean;
  /** Shape hint for presentation placeholders. */
  shape?: 'circle' | 'square' | 'diamond' | 'triangle' | 'hex';
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
    shape: 'circle',
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
    shape: 'circle',
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
    shape: 'triangle',
  },
  serf: {
    id: 'serf',
    name: 'Serf',
    speciesId: 'nobles',
    maxHp: 50,
    dmg: 3,
    range: 26,
    speed: 95,
    radius: 12,
    vision: 210,
    attackCooldownMs: 950,
    canGather: true,
    carryCapacity: 10,
    costGold: 40,
    costCrystals: 0,
    trainMs: 2400,
    shape: 'circle',
  },
  tin_knight: {
    id: 'tin_knight',
    name: 'Tin Knight',
    speciesId: 'nobles',
    maxHp: 110,
    dmg: 11,
    range: 34,
    speed: 88,
    radius: 14,
    vision: 240,
    attackCooldownMs: 720,
    canGather: false,
    carryCapacity: 0,
    costGold: 55,
    costCrystals: 0,
    trainMs: 2800,
    usesFormation: true,
    shape: 'square',
  },
  bolt_boy: {
    id: 'bolt_boy',
    name: 'Bolt Boy',
    speciesId: 'nobles',
    maxHp: 65,
    dmg: 10,
    range: 145,
    speed: 82,
    radius: 12,
    vision: 280,
    attackCooldownMs: 800,
    canGather: false,
    carryCapacity: 0,
    costGold: 60,
    costCrystals: 5,
    trainMs: 3000,
    usesFormation: true,
    shape: 'triangle',
  },
  hammer_dwarf: {
    id: 'hammer_dwarf',
    name: 'Hammer Dwarf',
    speciesId: 'nobles',
    maxHp: 140,
    dmg: 16,
    range: 32,
    speed: 72,
    radius: 15,
    vision: 220,
    attackCooldownMs: 850,
    canGather: false,
    carryCapacity: 0,
    costGold: 80,
    costCrystals: 0,
    trainMs: 3400,
    usesFormation: true,
    shape: 'hex',
  },
  boar_knight: {
    id: 'boar_knight',
    name: 'Boar Knight',
    speciesId: 'nobles',
    maxHp: 95,
    dmg: 13,
    range: 30,
    speed: 130,
    radius: 14,
    vision: 260,
    attackCooldownMs: 700,
    canGather: false,
    carryCapacity: 0,
    costGold: 75,
    costCrystals: 0,
    trainMs: 3200,
    usesFormation: true,
    shape: 'diamond',
  },
  walking_tank: {
    id: 'walking_tank',
    name: 'Walking Tank',
    speciesId: 'nobles',
    maxHp: 220,
    dmg: 18,
    range: 50,
    speed: 55,
    radius: 18,
    vision: 240,
    attackCooldownMs: 1100,
    canGather: false,
    carryCapacity: 0,
    costGold: 120,
    costCrystals: 15,
    trainMs: 5000,
    structureMult: 1.6,
    usesFormation: false,
    shape: 'square',
  },
  boom_cart: {
    id: 'boom_cart',
    name: 'Boom Cart',
    speciesId: 'nobles',
    maxHp: 80,
    dmg: 22,
    range: 180,
    speed: 60,
    radius: 16,
    vision: 260,
    attackCooldownMs: 1400,
    canGather: false,
    carryCapacity: 0,
    costGold: 110,
    costCrystals: 20,
    trainMs: 4800,
    structureMult: 2.2,
    usesFormation: false,
    shape: 'hex',
  },
};

export function getUnitType(id: UnitTypeId): UnitTypeDef {
  return UNIT_TYPES[id];
}
