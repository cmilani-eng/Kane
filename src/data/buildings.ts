/**
 * Data-driven building defs — Brutes first (Junkyard / Bonker Hut).
 */

import type { ResourceWallet } from './resources';
import type { UnitTypeId } from './units';

export type BuildingTypeId = 'junkyard' | 'bonker_hut' | 'rival_keep' | 'rival_barracks';

export interface BuildingTypeDef {
  id: BuildingTypeId;
  name: string;
  speciesId: 'brutes' | 'nobles' | 'weirdos';
  maxHp: number;
  radius: number;
  buildMs: number;
  cost: Partial<ResourceWallet>;
  /** Acts as resource drop-off when complete. */
  isDropOff: boolean;
  /** Units this building can train (production milestone). */
  trains: UnitTypeId[];
  color: number;
  accent: number;
}

export const BUILDING_TYPES: Record<BuildingTypeId, BuildingTypeDef> = {
  junkyard: {
    id: 'junkyard',
    name: 'Junkyard',
    speciesId: 'brutes',
    maxHp: 1200,
    radius: 36,
    buildMs: 0,
    cost: {},
    isDropOff: true,
    trains: ['scavenger'],
    color: 0x4a7a3a,
    accent: 0xd4782e,
  },
  bonker_hut: {
    id: 'bonker_hut',
    name: 'Bonker Hut',
    speciesId: 'brutes',
    maxHp: 500,
    radius: 28,
    buildMs: 4500,
    cost: { gold: 100, magic_crystals: 0 },
    isDropOff: false,
    trains: ['bonker', 'rock_thrower'],
    color: 0x3d6a32,
    accent: 0xf0c75e,
  },
  rival_keep: {
    id: 'rival_keep',
    name: 'Rival Keep',
    speciesId: 'nobles',
    maxHp: 1200,
    radius: 36,
    buildMs: 0,
    cost: {},
    isDropOff: true,
    trains: ['rival_scavenger'],
    color: 0x6b4a8a,
    accent: 0xc4a0e0,
  },
  rival_barracks: {
    id: 'rival_barracks',
    name: 'Rival Barracks',
    speciesId: 'nobles',
    maxHp: 500,
    radius: 28,
    buildMs: 4500,
    cost: { gold: 100 },
    isDropOff: false,
    trains: ['rival_grunt'],
    color: 0x5a3a70,
    accent: 0xe8a0ff,
  },
};

export function getBuildingType(id: BuildingTypeId): BuildingTypeDef {
  return BUILDING_TYPES[id];
}
