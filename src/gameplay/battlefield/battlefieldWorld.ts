/**
 * Battlefield gameplay world — select/move/combat + economy.
 * Presentation stays in scenes.
 */
import { MAP } from '../../config/balance';
import {
  emptyWallet,
  type ResourceId,
  type ResourceWallet,
} from '../../data/resources';
import { getBuildingType, type BuildingTypeId } from '../../data/buildings';
import {
  getSkirmishMap,
  type SkirmishMapId,
} from '../../data/skirmishMaps';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { clamp, dist, moveToward } from '../math';
import type { Vec2 } from '../types';
import {
  getAiDifficulty,
  type AiDifficultyId,
} from './aiDifficulty';
import { seedCoreFragments } from './battlefieldCoreFragments';
import { createDefaultNodes } from './battlefieldEconomy';
import { createFogState, isVisible } from './battlefieldFog';
import { setUnitPath } from './battlefieldPathfinding';
import { mutationSpeedMult } from './battlefieldMutations';
import { rageSpeedMult } from './battlefieldRage';
import { defaultRallyFor } from './battlefieldRally';
import { spawnWaypointMarker } from './battlefieldWaypointMarkers';

export type BattlefieldTeam = 'player' | 'enemy' | 'neutral';

export interface ResourceNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  resourceId: ResourceId;
  remaining: number;
  maxAmount: number;
}

export interface Stockpile {
  id: number;
  team: BattlefieldTeam;
  x: number;
  y: number;
  radius: number;
}

export interface BattlefieldBuilding {
  id: number;
  team: BattlefieldTeam;
  typeId: BuildingTypeId;
  name: string;
  x: number;
  y: number;
  radius: number;
  maxHp: number;
  hp: number;
  buildProgress: number;
  buildMs: number;
  complete: boolean;
  isDropOff: boolean;
  color: number;
  accent: number;
  /** Production queue (unit type ids). */
  trainQueue: UnitTypeId[];
  trainProgressMs: number;
  /** Where freshly trained units march (world coords). */
  rallyX: number;
  rallyY: number;
  selected?: boolean;
}

export interface BattlefieldUnit {
  id: number;
  team: BattlefieldTeam;
  speciesId: SpeciesId;
  typeId: UnitTypeId;
  name: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  maxHp: number;
  hp: number;
  dmg: number;
  range: number;
  vision: number;
  attackCooldownMs: number;
  attackCd: number;
  attackTargetId: number | null;
  lastAttackFlashMs: number;
  selected: boolean;
  moveTarget: Vec2 | null;
  /** Remaining path waypoints after `moveTarget` (building-aware). */
  path: Vec2[];
  /** When true, auto-acquire enemies while marching (attack-move). */
  attackMove: boolean;
  color: number;
  canGather: boolean;
  carryCapacity: number;
  carrying: number;
  carryingResource: ResourceId | null;
  gatherNodeId: number | null;
  /** Nobles FORMATIONS state. */
  inFormation: boolean;
  formationLocked: boolean;
  formationStillMs: number;
  /** Weirdos MUTATION state. */
  mutated: boolean;
  mutationLocked: boolean;
  /** Brutes RAGE state. */
  enraged: boolean;
  rageLocked: boolean;
  rageCombatMs: number;
}

export interface BattlefieldWorld {
  nextId: number;
  units: BattlefieldUnit[];
  buildings: BattlefieldBuilding[];
  nodes: ResourceNode[];
  stockpiles: Stockpile[];
  wallet: ResourceWallet;
  enemyWallet: ResourceWallet;
  /** Player species for this match. */
  speciesId: SpeciesId;
  /** Enemy species (the other playable faction). */
  enemySpeciesId: SpeciesId;
  /** Hero runtime + ability VFX (see battlefieldHeroes). */
  heroRuntime: import('./battlefieldHeroes').HeroRuntime | null;
  enemyHeroRuntime: import('./battlefieldHeroes').HeroRuntime | null;
  vfx: import('./battlefieldHeroes').HeroVfx[];
  /** Short combat hit / death pops (presentation). */
  combatFx: import('./battlefieldCombatFx').CombatFx[];
  /** Gather / deposit ticks & pops (presentation). */
  economyFx: import('./battlefieldEconomyFx').EconomyFx[];
  /** Brief halt rings when S / Stop is issued. */
  stopFx: import('./battlefieldStopFx').StopFx[];
  /** Control-group assign/recall rings. */
  controlGroupFx: import('./battlefieldControlGroupFx').ControlGroupFx[];
  /** Fog scout reveal pulses (new explored cells). */
  scoutPulses: import('./battlefieldScoutPulse').ScoutPulse[];
  /** Move / attack-move ground waypoints. */
  waypointMarkers: import('./battlefieldWaypointMarkers').WaypointMarker[];
  /** Capturable CORE fragments (shattered KANE CORE). */
  coreFragments: import('./battlefieldCoreFragments').CoreFragment[];
  /** Presentation cue — claim SFX window. */
  coreClaimFlashMs: number;
  /** Player CORE victory-hold accumulator (ms). */
  playerCoreHoldMs: number;
  /** Enemy CORE victory-hold accumulator (ms). */
  enemyCoreHoldMs: number;
  /** Player under-attack edge alert (enemy damage on friendlies). */
  underAttackAlert: import('./battlefieldUnderAttack').UnderAttackAlert;
  /** Player fog of war (explored / visible). */
  fog: import('./battlefieldFog').FogState;
  /** Skirmish AI difficulty for this match. */
  aiDifficulty: import('./aiDifficulty').AiDifficultyId;
  /** Selected skirmish map layout. */
  mapId: SkirmishMapId;
}

function seedHall(
  world: BattlefieldWorld,
  team: BattlefieldTeam,
  typeId: BuildingTypeId,
  x: number,
  y: number,
): void {
  const def = getBuildingType(typeId);
  world.buildings.push({
    id: world.nextId++,
    team,
    typeId,
    name: def.name,
    x,
    y,
    radius: def.radius,
    maxHp: def.maxHp,
    hp: def.maxHp,
    buildProgress: 1,
    buildMs: 0,
    complete: true,
    isDropOff: def.isDropOff,
    color: def.color,
    accent: def.accent,
    trainQueue: [],
    trainProgressMs: 0,
    ...defaultRallyFor({ x, y, radius: def.radius }),
  });
  world.stockpiles.push({
    id: world.nextId++,
    team,
    x,
    y,
    radius: def.radius + 8,
  });
}

export function spawnUnit(
  world: BattlefieldWorld,
  opts: {
    team: BattlefieldTeam;
    typeId: UnitTypeId;
    x: number;
    y: number;
    color: number;
    speciesId?: SpeciesId;
  },
): BattlefieldUnit {
  const def = getUnitType(opts.typeId);
  const u: BattlefieldUnit = {
    id: world.nextId++,
    team: opts.team,
    speciesId: opts.speciesId ?? def.speciesId,
    typeId: opts.typeId,
    name: def.name,
    x: opts.x,
    y: opts.y,
    radius: def.radius,
    speed: def.speed,
    maxHp: def.maxHp,
    hp: def.maxHp,
    dmg: def.dmg,
    range: def.range,
    vision: def.vision,
    attackCooldownMs: def.attackCooldownMs,
    attackCd: 0,
    attackTargetId: null,
    lastAttackFlashMs: 0,
    selected: false,
    moveTarget: null,
    path: [],
    attackMove: false,
    color: opts.color,
    canGather: def.canGather,
    carryCapacity: def.carryCapacity,
    carrying: 0,
    carryingResource: null,
    gatherNodeId: null,
    inFormation: false,
    formationLocked: false,
    formationStillMs: 0,
    mutated: false,
    mutationLocked: false,
    enraged: false,
    rageLocked: false,
    rageCombatMs: 0,
  };
  world.units.push(u);
  return u;
}

function oppositePlayable(id: SpeciesId): SpeciesId {
  if (id === 'weirdos') return 'nobles';
  if (id === 'nobles') return 'brutes';
  return 'weirdos';
}

function hallForSpecies(speciesId: SpeciesId): BuildingTypeId {
  if (speciesId === 'nobles') return 'royal_keep';
  if (speciesId === 'weirdos') return 'weird_core';
  return 'junkyard';
}

function seedArmy(
  world: BattlefieldWorld,
  team: BattlefieldTeam,
  speciesId: SpeciesId,
  originX: number,
  originY: number,
): void {
  const pal = SPECIES[speciesId].palette;
  if (speciesId === 'brutes') {
    for (let i = 0; i < 4; i++) {
      spawnUnit(world, {
        team,
        typeId: 'scavenger',
        x: originX + i * 40,
        y: originY - 50,
        color: 0x6a9a4a,
        speciesId,
      });
    }
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      spawnUnit(world, {
        team,
        typeId: 'bonker',
        x: originX + col * 48,
        y: originY + row * 48,
        color: i % 2 === 0 ? pal.primary : pal.accent,
        speciesId,
      });
    }
    for (let i = 0; i < 2; i++) {
      spawnUnit(world, {
        team,
        typeId: 'rock_thrower',
        x: originX + 160 + i * 48,
        y: originY + 20,
        color: pal.accent,
        speciesId,
      });
    }
    return;
  }

  if (speciesId === 'weirdos') {
    const pink = pal.pink ?? 0xe87aa8;
    for (let i = 0; i < 4; i++) {
      spawnUnit(world, {
        team,
        typeId: 'goo_worker',
        x: originX + i * 40,
        y: originY - 50,
        color: pink,
        speciesId,
      });
    }
    for (let i = 0; i < 5; i++) {
      spawnUnit(world, {
        team,
        typeId: 'bloblet',
        x: originX + (i % 3) * 44,
        y: originY + Math.floor(i / 3) * 44,
        color: i % 2 === 0 ? pal.primary : pink,
        speciesId,
      });
    }
    for (let i = 0; i < 2; i++) {
      spawnUnit(world, {
        team,
        typeId: 'eyebat',
        x: originX + 120 + i * 44,
        y: originY + 8,
        color: pal.accent,
        speciesId,
      });
    }
    spawnUnit(world, {
      team,
      typeId: 'shroom_mage',
      x: originX + 70,
      y: originY + 100,
      color: pink,
      speciesId,
    });
    return;
  }

  // Nobles — blue / gold / silver placeholders
  for (let i = 0; i < 4; i++) {
    spawnUnit(world, {
      team,
      typeId: 'serf',
      x: originX + i * 40,
      y: originY - 50,
      color: pal.silver ?? 0xc0c8d4,
      speciesId,
    });
  }
  for (let i = 0; i < 4; i++) {
    spawnUnit(world, {
      team,
      typeId: 'tin_knight',
      x: originX + (i % 2) * 48,
      y: originY + Math.floor(i / 2) * 48,
      color: pal.primary,
      speciesId,
    });
  }
  for (let i = 0; i < 2; i++) {
    spawnUnit(world, {
      team,
      typeId: 'bolt_boy',
      x: originX + 110 + i * 44,
      y: originY + 10,
      color: pal.accent,
      speciesId,
    });
  }
  spawnUnit(world, {
    team,
    typeId: 'hammer_dwarf',
    x: originX + 60,
    y: originY + 100,
    color: pal.silver ?? 0xc0c8d4,
    speciesId,
  });
}

export function createBattlefieldWorld(
  playerSpecies: SpeciesId = 'brutes',
  difficulty: AiDifficultyId = 'normal',
  mapId?: string | null,
): BattlefieldWorld {
  const enemySpecies = oppositePlayable(playerSpecies);
  const ai = getAiDifficulty(difficulty);
  const layout = getSkirmishMap(mapId);
  const world: BattlefieldWorld = {
    nextId: 1,
    units: [],
    buildings: [],
    nodes: [],
    stockpiles: [],
    wallet: emptyWallet({
      gold: Math.max(80, 220 + ai.playerStartGoldBonus),
      magic_crystals: Math.max(0, 40 + ai.playerStartCrystalBonus),
    }),
    enemyWallet: emptyWallet({
      gold: Math.max(40, 200 + ai.startGoldBonus),
      magic_crystals: Math.max(0, 30 + ai.startCrystalBonus),
    }),
    speciesId: playerSpecies,
    enemySpeciesId: enemySpecies,
    heroRuntime: null,
    enemyHeroRuntime: null,
    vfx: [],
    combatFx: [],
    economyFx: [],
    stopFx: [],
    controlGroupFx: [],
    scoutPulses: [],
    waypointMarkers: [],
    coreFragments: [],
    coreClaimFlashMs: 0,
    playerCoreHoldMs: 0,
    enemyCoreHoldMs: 0,
    underAttackAlert: {
      lifeMs: 0,
      maxLifeMs: 520,
      x: 0,
      y: 0,
      cooldownMs: 0,
      pulse: false,
      severity: 'normal',
      kind: 'unit',
    },
    fog: createFogState(),
    aiDifficulty: ai.id,
    mapId: layout.id,
  };

  const baseX = layout.playerBase.x;
  const baseY = layout.playerBase.y;
  const ex = layout.enemyBase.x;
  const ey = layout.enemyBase.y;

  seedHall(
    world,
    'player',
    hallForSpecies(playerSpecies),
    baseX - 60,
    baseY + 60,
  );
  seedHall(
    world,
    'enemy',
    hallForSpecies(enemySpecies),
    ex - 60,
    ey + 60,
  );

  seedArmy(world, 'player', playerSpecies, baseX, baseY);
  seedArmy(world, 'enemy', enemySpecies, ex, ey);

  createDefaultNodes(world, layout.nodes);
  seedCoreFragments(world, layout.cores);
  return world;
}

export function clearSelection(world: BattlefieldWorld): void {
  for (const u of world.units) u.selected = false;
}

export function selectAt(
  world: BattlefieldWorld,
  x: number,
  y: number,
  additive = false,
): boolean {
  const best = findPlayerUnitAt(world, x, y);
  if (!additive) clearSelection(world);
  if (best) {
    if (additive) best.selected = !best.selected;
    else best.selected = true;
    return true;
  }
  return false;
}

/** A living unit on the player's team. */
export function isLivingPlayerUnit(u: BattlefieldUnit): boolean {
  return u.team === 'player' && u.hp > 0;
}

/** Nearest player unit under a world point (for click / double-tap). */
export function findPlayerUnitAt(
  world: BattlefieldWorld,
  x: number,
  y: number,
): BattlefieldUnit | null {
  let best: BattlefieldUnit | null = null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (!isLivingPlayerUnit(u)) continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 12 && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  return best;
}

/**
 * Double-click / double-tap — select every fog-visible player unit of `typeId`.
 */
export function selectAllVisibleSameType(
  world: BattlefieldWorld,
  typeId: UnitTypeId,
): number {
  clearSelection(world);
  let n = 0;
  for (const u of world.units) {
    if (!isLivingPlayerUnit(u)) continue;
    if (u.typeId !== typeId) continue;
    if (!isVisible(world.fog, u.x, u.y)) continue;
    u.selected = true;
    n++;
  }
  return n;
}

export function selectInRect(
  world: BattlefieldWorld,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  additive = false,
): void {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (!additive) clearSelection(world);
  for (const u of world.units) {
    if (u.team !== 'player') continue;
    if (u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
      u.selected = true;
    }
  }
}

export function issueMoveSelected(
  world: BattlefieldWorld,
  x: number,
  y: number,
): void {
  const selected = world.units.filter((u) => u.selected && u.team === 'player');
  if (selected.length === 0) return;
  selected.forEach((u, i) => {
    u.attackTargetId = null;
    u.gatherNodeId = null;
    u.attackMove = false;
    const ox = (i % 5) * 28 - 56;
    const oy = Math.floor(i / 5) * 28;
    setUnitPath(world, u, {
      x: clamp(x + ox, 20, MAP.width - 20),
      y: clamp(y + oy, 20, MAP.height - 20),
    });
  });
  spawnWaypointMarker(
    world,
    clamp(x, 20, MAP.width - 20),
    clamp(y, 20, MAP.height - 20),
    'move',
    selected.map((u) => u.id),
  );
}

/** Accumulator for throttled soft-separation (ms). */
let separateAccMs = 0;
const SEPARATE_MS = 50;
const SEP_CELL = 96;

export function tickBattlefield(world: BattlefieldWorld, dtMs: number): void {
  const dt = Math.min(dtMs, 50) / 1000;
  for (const u of world.units) {
    if (u.speed <= 0) continue;
    if (!u.moveTarget) {
      if (u.path.length > 0) u.moveTarget = u.path.shift()!;
      else continue;
    }
    const spd = u.speed * mutationSpeedMult(u) * rageSpeedMult(u);
    const next = moveToward(
      u.x,
      u.y,
      u.moveTarget.x,
      u.moveTarget.y,
      spd,
      dt,
    );
    u.x = clamp(next.x, u.radius, MAP.width - u.radius);
    u.y = clamp(next.y, u.radius, MAP.height - u.radius);
    if (dist(u.x, u.y, u.moveTarget.x, u.moveTarget.y) < 4) {
      u.moveTarget = u.path.length > 0 ? u.path.shift()! : null;
    }
  }
  separateAccMs += dtMs;
  if (separateAccMs >= SEPARATE_MS) {
    separateAccMs = 0;
    softSeparateUnits(world);
  }
}

/**
 * Soft pack separation — spatial buckets so mid-match unit caps stay cheap.
 * Runs on a throttle (SEPARATE_MS), not every frame.
 */
function softSeparateUnits(world: BattlefieldWorld): void {
  const units = world.units;
  const n = units.length;
  if (n < 2) return;

  const cols = Math.ceil(MAP.width / SEP_CELL);
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const u = units[i]!;
    if (u.hp <= 0) continue;
    const cx = Math.max(0, Math.min(cols - 1, (u.x / SEP_CELL) | 0));
    const cy = (u.y / SEP_CELL) | 0;
    const key = cy * cols + cx;
    let list = buckets.get(key);
    if (!list) {
      list = [];
      buckets.set(key, list);
    }
    list.push(i);
  }

  const pushPair = (i: number, j: number): void => {
    const a = units[i]!;
    const b = units[j]!;
    const minD = a.radius + b.radius + 2;
    const d = dist(a.x, a.y, b.x, b.y);
    if (d >= minD || d < 0.001) return;
    const push = ((minD - d) / minD) * 0.45;
    const nx = (a.x - b.x) / d;
    const ny = (a.y - b.y) / d;
    a.x = clamp(a.x + nx * push * a.radius, a.radius, MAP.width - a.radius);
    a.y = clamp(a.y + ny * push * a.radius, a.radius, MAP.height - a.radius);
    b.x = clamp(b.x - nx * push * b.radius, b.radius, MAP.width - b.radius);
    b.y = clamp(b.y - ny * push * b.radius, b.radius, MAP.height - b.radius);
  };

  for (const [key, list] of buckets) {
    const cx = key % cols;
    const cy = (key / cols) | 0;
    // Self + right + down + diagonals (avoid double work)
    const neighbors = [
      key,
      cy * cols + (cx + 1),
      (cy + 1) * cols + cx,
      (cy + 1) * cols + (cx + 1),
      (cy + 1) * cols + (cx - 1),
    ];
    for (let a = 0; a < list.length; a++) {
      const ia = list[a]!;
      for (let b = a + 1; b < list.length; b++) pushPair(ia, list[b]!);
      for (let nIdx = 1; nIdx < neighbors.length; nIdx++) {
        const other = buckets.get(neighbors[nIdx]!);
        if (!other) continue;
        for (const ib of other) pushPair(ia, ib);
      }
    }
  }
}

export function selectedCount(world: BattlefieldWorld): number {
  return world.units.filter((u) => u.selected).length;
}

export function selectedUnits(world: BattlefieldWorld): BattlefieldUnit[] {
  return world.units.filter((u) => u.selected && u.team === 'player');
}
