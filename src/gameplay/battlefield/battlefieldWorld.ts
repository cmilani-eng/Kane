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
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { clamp, dist, moveToward } from '../math';
import type { Vec2 } from '../types';
import { createDefaultNodes } from './battlefieldEconomy';

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
  color: number;
  canGather: boolean;
  carryCapacity: number;
  carrying: number;
  carryingResource: ResourceId | null;
  gatherNodeId: number | null;
}

export interface BattlefieldWorld {
  nextId: number;
  units: BattlefieldUnit[];
  buildings: BattlefieldBuilding[];
  nodes: ResourceNode[];
  stockpiles: Stockpile[];
  wallet: ResourceWallet;
  enemyWallet: ResourceWallet;
  speciesId: SpeciesId;
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
    color: opts.color,
    canGather: def.canGather,
    carryCapacity: def.carryCapacity,
    carrying: 0,
    carryingResource: null,
    gatherNodeId: null,
  };
  world.units.push(u);
  return u;
}

export function createBattlefieldWorld(): BattlefieldWorld {
  const brutes = SPECIES.brutes;
  const world: BattlefieldWorld = {
    nextId: 1,
    units: [],
    buildings: [],
    nodes: [],
    stockpiles: [],
    wallet: emptyWallet({ gold: 200, magic_crystals: 20 }),
    enemyWallet: emptyWallet({ gold: 180, magic_crystals: 15 }),
    speciesId: 'brutes',
  };

  const baseX = 420;
  const baseY = MAP.height - 420;
  const ex = MAP.width * 0.55;
  const ey = MAP.height * 0.45;

  seedHall(world, 'player', 'junkyard', baseX - 60, baseY + 60);
  seedHall(world, 'enemy', 'rival_keep', ex - 60, ey + 60);

  // Gatherers
  for (let i = 0; i < 4; i++) {
    spawnUnit(world, {
      team: 'player',
      typeId: 'scavenger',
      x: baseX + i * 40,
      y: baseY - 50,
      color: 0x6a9a4a,
      speciesId: 'brutes',
    });
  }
  // Military
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    spawnUnit(world, {
      team: 'player',
      typeId: 'bonker',
      x: baseX + col * 48,
      y: baseY + row * 48,
      color: i % 2 === 0 ? brutes.palette.primary : brutes.palette.accent,
      speciesId: 'brutes',
    });
  }
  for (let i = 0; i < 2; i++) {
    spawnUnit(world, {
      team: 'player',
      typeId: 'rock_thrower',
      x: baseX + 160 + i * 48,
      y: baseY + 20,
      color: brutes.palette.accent,
      speciesId: 'brutes',
    });
  }

  for (let i = 0; i < 2; i++) {
    spawnUnit(world, {
      team: 'enemy',
      typeId: 'rival_scavenger',
      x: ex + i * 40,
      y: ey - 50,
      color: 0xa070b8,
      speciesId: 'nobles',
    });
  }
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    spawnUnit(world, {
      team: 'enemy',
      typeId: 'rival_grunt',
      x: ex + col * 46,
      y: ey + row * 46,
      color: 0x8a4a9a,
      speciesId: 'nobles',
    });
  }

  createDefaultNodes(world);
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
  let best: BattlefieldUnit | null = null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (u.team !== 'player') continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 12 && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  if (!additive) clearSelection(world);
  if (best) {
    if (additive) best.selected = !best.selected;
    else best.selected = true;
    return true;
  }
  return false;
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
  selected.forEach((u, i) => {
    u.attackTargetId = null;
    u.gatherNodeId = null;
    const ox = (i % 5) * 28 - 56;
    const oy = Math.floor(i / 5) * 28;
    u.moveTarget = {
      x: clamp(x + ox, 20, MAP.width - 20),
      y: clamp(y + oy, 20, MAP.height - 20),
    };
  });
}

export function tickBattlefield(world: BattlefieldWorld, dtMs: number): void {
  const dt = Math.min(dtMs, 50) / 1000;
  for (const u of world.units) {
    if (!u.moveTarget || u.speed <= 0) continue;
    const next = moveToward(
      u.x,
      u.y,
      u.moveTarget.x,
      u.moveTarget.y,
      u.speed,
      dt,
    );
    u.x = clamp(next.x, u.radius, MAP.width - u.radius);
    u.y = clamp(next.y, u.radius, MAP.height - u.radius);
    if (dist(u.x, u.y, u.moveTarget.x, u.moveTarget.y) < 4) {
      u.moveTarget = null;
    }
  }
}

export function selectedCount(world: BattlefieldWorld): number {
  return world.units.filter((u) => u.selected).length;
}

export function selectedUnits(world: BattlefieldWorld): BattlefieldUnit[] {
  return world.units.filter((u) => u.selected && u.team === 'player');
}
