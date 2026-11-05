/**
 * Battlefield gameplay world — select/move + combat stats.
 * No buildings / economy / full AI. Presentation stays in scenes.
 */
import { MAP } from '../../config/balance';
import { emptyWallet, type ResourceWallet } from '../../data/resources';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { clamp, dist, moveToward } from '../math';
import type { Vec2 } from '../types';

export type BattlefieldTeam = 'player' | 'enemy' | 'neutral';

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
  /** Brief presentation flash after dealing damage. */
  lastAttackFlashMs: number;
  selected: boolean;
  moveTarget: Vec2 | null;
  color: number;
}

export interface BattlefieldWorld {
  nextId: number;
  units: BattlefieldUnit[];
  wallet: ResourceWallet;
  /** Player species for this skirmish. */
  speciesId: SpeciesId;
}

function spawnUnit(
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
  };
  world.units.push(u);
  return u;
}

/** Player Brutes vs enemy placeholder grunts — enough for a skirmish. */
export function createBattlefieldWorld(): BattlefieldWorld {
  const brutes = SPECIES.brutes;
  const world: BattlefieldWorld = {
    nextId: 1,
    units: [],
    wallet: emptyWallet({ scrap: 0, core: 0 }),
    speciesId: 'brutes',
  };

  const baseX = 420;
  const baseY = MAP.height - 420;
  // 8 melee Bonkers + 4 Rock Throwers = 12 friendly
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    spawnUnit(world, {
      team: 'player',
      typeId: 'bonker',
      x: baseX + col * 48,
      y: baseY + row * 48,
      color: i % 2 === 0 ? brutes.palette.primary : brutes.palette.accent,
      speciesId: 'brutes',
    });
  }
  for (let i = 0; i < 4; i++) {
    spawnUnit(world, {
      team: 'player',
      typeId: 'rock_thrower',
      x: baseX + i * 48,
      y: baseY + 110,
      color: brutes.palette.accent,
      speciesId: 'brutes',
    });
  }

  // Enemy cluster toward map center-east
  const ex = MAP.width * 0.55;
  const ey = MAP.height * 0.45;
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    spawnUnit(world, {
      team: 'enemy',
      typeId: 'rival_grunt',
      x: ex + col * 46,
      y: ey + row * 46,
      color: 0x8a4a9a,
      speciesId: 'nobles',
    });
  }

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
