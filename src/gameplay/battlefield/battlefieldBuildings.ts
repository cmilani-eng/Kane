/**
 * Buildings — placement validation, construction tick, collision, drop-off sync.
 */
import { MAP } from '../../config/balance';
import {
  getBuildingType,
  type BuildingTypeId,
} from '../../data/buildings';
import type { ResourceWallet } from '../../data/resources';
import { dist } from '../math';
import { spawnDeathFx } from './battlefieldCombatFx';
import type {
  BattlefieldBuilding,
  BattlefieldTeam,
  BattlefieldWorld,
} from './battlefieldWorld';
import { walletOf } from './battlefieldEconomy';

export function canAfford(
  wallet: ResourceWallet,
  cost: Partial<ResourceWallet>,
): boolean {
  if ((cost.gold ?? 0) > wallet.gold) return false;
  if ((cost.magic_crystals ?? 0) > wallet.magic_crystals) return false;
  return true;
}

export function pay(
  wallet: ResourceWallet,
  cost: Partial<ResourceWallet>,
): boolean {
  if (!canAfford(wallet, cost)) return false;
  wallet.gold -= cost.gold ?? 0;
  wallet.magic_crystals -= cost.magic_crystals ?? 0;
  return true;
}

export function buildingBlocks(
  world: BattlefieldWorld,
  x: number,
  y: number,
  radius: number,
  ignoreId?: number,
): boolean {
  if (
    x - radius < 20 ||
    y - radius < 20 ||
    x + radius > MAP.width - 20 ||
    y + radius > MAP.height - 20
  ) {
    return true;
  }
  for (const b of world.buildings) {
    if (ignoreId != null && b.id === ignoreId) continue;
    if (dist(b.x, b.y, x, y) < b.radius + radius + 8) return true;
  }
  for (const u of world.units) {
    if (dist(u.x, u.y, x, y) < u.radius + radius * 0.5) return true;
  }
  for (const n of world.nodes) {
    if (dist(n.x, n.y, x, y) < n.radius + radius) return true;
  }
  return false;
}

export function placeBuilding(
  world: BattlefieldWorld,
  team: BattlefieldTeam,
  typeId: BuildingTypeId,
  x: number,
  y: number,
): BattlefieldBuilding | null {
  const def = getBuildingType(typeId);
  if (buildingBlocks(world, x, y, def.radius)) return null;
  const wallet = walletOf(world, team);
  if (!pay(wallet, def.cost)) return null;

  const complete = def.buildMs <= 0;
  const b: BattlefieldBuilding = {
    id: world.nextId++,
    team,
    typeId,
    name: def.name,
    x,
    y,
    radius: def.radius,
    maxHp: def.maxHp,
    hp: def.maxHp,
    buildProgress: complete ? 1 : 0,
    buildMs: def.buildMs,
    complete,
    isDropOff: def.isDropOff,
    color: def.color,
    accent: def.accent,
    trainQueue: [],
    trainProgressMs: 0,
  };
  world.buildings.push(b);
  syncStockpilesFromBuildings(world);
  return b;
}

/** Keep stockpile points aligned with completed drop-off buildings. */
export function syncStockpilesFromBuildings(world: BattlefieldWorld): void {
  for (const team of ['player', 'enemy'] as BattlefieldTeam[]) {
    const drop = world.buildings.find(
      (b) => b.team === team && b.isDropOff && b.complete,
    );
    let pile = world.stockpiles.find((s) => s.team === team);
    if (drop) {
      if (!pile) {
        pile = {
          id: world.nextId++,
          team,
          x: drop.x,
          y: drop.y,
          radius: drop.radius + 8,
        };
        world.stockpiles.push(pile);
      } else {
        pile.x = drop.x;
        pile.y = drop.y;
        pile.radius = drop.radius + 8;
      }
    }
  }
}

export function tickBuildings(world: BattlefieldWorld, dtMs: number): void {
  for (const b of world.buildings) {
    if (b.complete) continue;
    if (b.buildMs <= 0) {
      b.complete = true;
      b.buildProgress = 1;
      continue;
    }
    b.buildProgress = Math.min(1, b.buildProgress + dtMs / b.buildMs);
    if (b.buildProgress >= 1) {
      b.complete = true;
      syncStockpilesFromBuildings(world);
    }
  }
}

export function findBuildingAt(
  world: BattlefieldWorld,
  x: number,
  y: number,
  team?: BattlefieldTeam,
): BattlefieldBuilding | null {
  let best: BattlefieldBuilding | null = null;
  let bestD = Infinity;
  for (const b of world.buildings) {
    if (team && b.team !== team) continue;
    const d = dist(b.x, b.y, x, y);
    if (d <= b.radius + 6 && d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

export function damageBuilding(
  world: BattlefieldWorld,
  b: BattlefieldBuilding,
  amount: number,
): void {
  b.hp -= amount;
  if (b.hp <= 0) {
    spawnDeathFx(world, b.x, b.y, b.radius, b.color);
    const i = world.buildings.findIndex((x) => x.id === b.id);
    if (i >= 0) world.buildings.splice(i, 1);
    syncStockpilesFromBuildings(world);
  }
}
