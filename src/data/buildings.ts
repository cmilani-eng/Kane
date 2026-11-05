/**
 * Data-driven buildings — Brutes + Nobles + Weirdos (GDD v2).
 */

import type { ResourceWallet } from './resources';
import type { UnitTypeId } from './units';

export type BuildingTypeId =
  // Brutes
  | 'junkyard'
  | 'bonker_hut'
  | 'big_boss_den'
  // Nobles
  | 'royal_keep'
  | 'barracks'
  | 'archery_hall'
  | 'stable'
  | 'engineering_yard'
  | 'watchtower'
  | 'royal_academy'
  // Weirdos
  | 'weird_core'
  | 'blob_factory'
  | 'eye_nest'
  | 'mushroom_lab'
  | 'mutation_pool'
  | 'magic_bubble'
  | 'portal_of_chaos';

export interface BuildingTypeDef {
  id: BuildingTypeId;
  name: string;
  speciesId: 'brutes' | 'nobles' | 'weirdos';
  maxHp: number;
  radius: number;
  buildMs: number;
  cost: Partial<ResourceWallet>;
  isDropOff: boolean;
  isMainHall: boolean;
  /** Recruits the species hero when selected (H). */
  recruitsHero?: boolean;
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
    isMainHall: true,
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
    isMainHall: false,
    trains: ['bonker', 'rock_thrower'],
    color: 0x3d6a32,
    accent: 0xf0c75e,
  },
  big_boss_den: {
    id: 'big_boss_den',
    name: 'Big Boss Den',
    speciesId: 'brutes',
    maxHp: 600,
    radius: 30,
    buildMs: 5000,
    cost: { gold: 120, magic_crystals: 20 },
    isDropOff: false,
    isMainHall: false,
    recruitsHero: true,
    trains: [],
    color: 0x5a3a20,
    accent: 0xd4782e,
  },
  royal_keep: {
    id: 'royal_keep',
    name: 'Royal Keep',
    speciesId: 'nobles',
    maxHp: 1300,
    radius: 38,
    buildMs: 0,
    cost: {},
    isDropOff: true,
    isMainHall: true,
    trains: ['serf'],
    color: 0x3d7ea6,
    accent: 0xf0c75e,
  },
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    speciesId: 'nobles',
    maxHp: 550,
    radius: 28,
    buildMs: 4500,
    cost: { gold: 100 },
    isDropOff: false,
    isMainHall: false,
    trains: ['tin_knight', 'hammer_dwarf'],
    color: 0x2f6f94,
    accent: 0xc0c8d4,
  },
  archery_hall: {
    id: 'archery_hall',
    name: 'Archery Hall',
    speciesId: 'nobles',
    maxHp: 480,
    radius: 26,
    buildMs: 4200,
    cost: { gold: 110, magic_crystals: 5 },
    isDropOff: false,
    isMainHall: false,
    trains: ['bolt_boy'],
    color: 0x4a6a8a,
    accent: 0xf0c75e,
  },
  stable: {
    id: 'stable',
    name: 'Stable',
    speciesId: 'nobles',
    maxHp: 500,
    radius: 28,
    buildMs: 4800,
    cost: { gold: 120 },
    isDropOff: false,
    isMainHall: false,
    trains: ['boar_knight'],
    color: 0x5a4a3a,
    accent: 0xd4b896,
  },
  engineering_yard: {
    id: 'engineering_yard',
    name: 'Engineering Yard',
    speciesId: 'nobles',
    maxHp: 520,
    radius: 30,
    buildMs: 5500,
    cost: { gold: 140, magic_crystals: 15 },
    isDropOff: false,
    isMainHall: false,
    trains: ['walking_tank', 'boom_cart'],
    color: 0x4a5560,
    accent: 0xa8b4c0,
  },
  watchtower: {
    id: 'watchtower',
    name: 'Watchtower',
    speciesId: 'nobles',
    maxHp: 400,
    radius: 22,
    buildMs: 3500,
    cost: { gold: 80 },
    isDropOff: false,
    isMainHall: false,
    trains: [],
    color: 0x3a4a5a,
    accent: 0xf0c75e,
  },
  royal_academy: {
    id: 'royal_academy',
    name: 'Royal Academy',
    speciesId: 'nobles',
    maxHp: 580,
    radius: 30,
    buildMs: 5200,
    cost: { gold: 130, magic_crystals: 25 },
    isDropOff: false,
    isMainHall: false,
    recruitsHero: true,
    trains: [],
    color: 0x2a4a6a,
    accent: 0xf0c75e,
  },
  weird_core: {
    id: 'weird_core',
    name: 'Weird Core',
    speciesId: 'weirdos',
    maxHp: 1250,
    radius: 38,
    buildMs: 0,
    cost: {},
    isDropOff: true,
    isMainHall: true,
    trains: ['goo_worker'],
    color: 0x7a4aa8,
    accent: 0x6ecfbf,
  },
  blob_factory: {
    id: 'blob_factory',
    name: 'Blob Factory',
    speciesId: 'weirdos',
    maxHp: 520,
    radius: 28,
    buildMs: 4500,
    cost: { gold: 100 },
    isDropOff: false,
    isMainHall: false,
    trains: ['bloblet', 'grabber'],
    color: 0x6a3a98,
    accent: 0xe87aa8,
  },
  eye_nest: {
    id: 'eye_nest',
    name: 'Eye Nest',
    speciesId: 'weirdos',
    maxHp: 460,
    radius: 26,
    buildMs: 4200,
    cost: { gold: 110, magic_crystals: 5 },
    isDropOff: false,
    isMainHall: false,
    trains: ['eyebat'],
    color: 0x5a4a88,
    accent: 0x6ecfbf,
  },
  mushroom_lab: {
    id: 'mushroom_lab',
    name: 'Mushroom Lab',
    speciesId: 'weirdos',
    maxHp: 500,
    radius: 28,
    buildMs: 4800,
    cost: { gold: 115, magic_crystals: 10 },
    isDropOff: false,
    isMainHall: false,
    trains: ['shroom_mage', 'floaty'],
    color: 0x4a6a58,
    accent: 0xe87aa8,
  },
  mutation_pool: {
    id: 'mutation_pool',
    name: 'Mutation Pool',
    speciesId: 'weirdos',
    maxHp: 560,
    radius: 30,
    buildMs: 5000,
    cost: { gold: 120, magic_crystals: 20 },
    isDropOff: false,
    isMainHall: false,
    trains: [],
    color: 0x8a3a78,
    accent: 0x6ecfbf,
  },
  magic_bubble: {
    id: 'magic_bubble',
    name: 'Magic Bubble',
    speciesId: 'weirdos',
    maxHp: 380,
    radius: 22,
    buildMs: 3400,
    cost: { gold: 80 },
    isDropOff: false,
    isMainHall: false,
    trains: [],
    color: 0x3a5a78,
    accent: 0xe87aa8,
  },
  portal_of_chaos: {
    id: 'portal_of_chaos',
    name: 'Portal of Chaos',
    speciesId: 'weirdos',
    maxHp: 540,
    radius: 30,
    buildMs: 5500,
    cost: { gold: 140, magic_crystals: 18 },
    isDropOff: false,
    isMainHall: false,
    recruitsHero: true,
    trains: ['crystal_freak'],
    color: 0x4a2a68,
    accent: 0x6ecfbf,
  },
};

export function getBuildingType(id: BuildingTypeId): BuildingTypeDef {
  return BUILDING_TYPES[id];
}

/** Placeable production / defense buildings for a species (not main hall). */
export function placeableBuildings(
  speciesId: 'brutes' | 'nobles' | 'weirdos',
): BuildingTypeId[] {
  return (Object.values(BUILDING_TYPES) as BuildingTypeDef[])
    .filter((b) => b.speciesId === speciesId && !b.isMainHall && b.buildMs > 0)
    .map((b) => b.id);
}

export function mainHallId(
  speciesId: 'brutes' | 'nobles' | 'weirdos',
): BuildingTypeId {
  const hall = (Object.values(BUILDING_TYPES) as BuildingTypeDef[]).find(
    (b) => b.speciesId === speciesId && b.isMainHall,
  );
  if (!hall) throw new Error(`No main hall for ${speciesId}`);
  return hall.id;
}
