/**
 * Tunable vertical-slice balance. Times in ms; distances in world px.
 * Canonical resources: Scrap + Core — see `src/data/resources.ts`.
 * Canonical species: Brutes / Nobles / Weirdos — see `src/data/speciesStub.ts`.
 * Legacy forage/aura keys below are temporary aliases until economy is rewritten.
 */

export const MAP = {
  width: 2400,
  height: 1600,
  tile: 40,
} as const;

/** Menu / M1 presentation — GDD prototype species = Nobles. */
export const FACTION = {
  id: 'nobles',
  name: 'The Nobles',
  blurb:
    'Knights, dwarves, and inventors with a plan (probably expensive). Prototype species — Formations later.',
  color: 0x3d7ea6,
  colorAlt: 0xf0c75e,
  enemyColor: 0x6b4a8a,
  enemyAlt: 0xc4a0e0,
} as const;

/**
 * @deprecated Prefer `src/data/resources.ts` (`scrap` / `core`).
 * Kept so deferred GameScene systems still compile until economy rewrite.
 */
export const RESOURCES = {
  startingForage: 220,
  startingAura: 0,
  forageNodeAmount: 80,
  foragePerTrip: 8,
  gatherRange: 36,
  depositRange: 56,
  workerMoveSpeed: 95,
  auraPerWardstonePerSec: 0.35,
} as const;

export const BUILD = {
  barracksCostForage: 100,
  barracksCostAura: 0,
  barracksBuildMs: 4500,
  keepHp: 1200,
  barracksHp: 500,
  placeSnap: 40,
} as const;

export const UNITS = {
  scout: {
    id: 'scout',
    name: 'Lantern Scout',
    costForage: 40,
    costAura: 0,
    trainMs: 2200,
    hp: 55,
    dmg: 6,
    range: 28,
    speed: 105,
    radius: 12,
    vision: 220,
    canGather: true,
  },
  melee: {
    id: 'melee',
    name: 'Kin Blade',
    costForage: 55,
    costAura: 0,
    trainMs: 2800,
    hp: 90,
    dmg: 12,
    range: 30,
    speed: 88,
    radius: 14,
    vision: 180,
    canGather: false,
  },
  ranged: {
    id: 'ranged',
    name: 'Bolt Archer',
    costForage: 60,
    costAura: 8,
    trainMs: 3200,
    hp: 65,
    dmg: 10,
    range: 140,
    speed: 80,
    radius: 12,
    vision: 200,
    canGather: false,
  },
} as const;

export type UnitKind = keyof typeof UNITS;

export const WARDSTONE = {
  count: 5,
  captureRange: 70,
  captureMs: 3500,
  holdNeeded: 3,
  holdWinMs: 120_000,
  auraVision: 260,
  hp: 1,
} as const;

export const COMBAT = {
  attackCooldownMs: 700,
  projectileSpeed: 320,
} as const;

export const AI = {
  thinkMs: 900,
  expandForageThreshold: 100,
  attackArmySize: 4,
} as const;
