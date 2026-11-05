/** Gameplay — unit production / training queues. */
import { UNITS, type UnitKind } from '../../config/balance';
import { flags } from '../../config/flags';
import type { Building, Team, Unit, World } from '../types';
import { pay, teamState } from '../resources/resourceSystem';

export function spawnUnit(
  world: World,
  kind: UnitKind,
  team: Team,
  x: number,
  y: number,
): Unit | null {
  const teamUnits = world.units.filter((u) => u.team === team).length;
  if (teamUnits >= flags.unitCap) return null;
  const def = UNITS[kind];
  const u: Unit = {
    id: world.nextId++,
    kind,
    team,
    x,
    y,
    hp: def.hp,
    maxHp: def.hp,
    targetId: null,
    moveTarget: null,
    path: [],
    gatherNodeId: null,
    carrying: 0,
    attackCd: 0,
    selected: false,
    radius: def.radius,
    speed: def.speed,
    dmg: def.dmg,
    range: def.range,
    vision: def.vision,
    canGather: def.canGather,
  };
  world.units.push(u);
  return u;
}

export function enqueueTrain(
  world: World,
  building: Building,
  kind: UnitKind,
): boolean {
  if (building.kind !== 'barracks' || building.buildProgress < 1) return false;
  if (building.trainQueue.length >= 3) return false;
  const def = UNITS[kind];
  if (!pay(world, building.team, def.costForage, def.costAura)) return false;
  building.trainQueue.push(kind);
  return true;
}

export function tickProduction(world: World, dtMs: number): void {
  for (const b of world.buildings) {
    if (b.buildProgress < 1) continue;
    if (b.kind !== 'barracks' || b.trainQueue.length === 0) continue;
    const kind = b.trainQueue[0]!;
    const def = UNITS[kind];
    b.trainProgress += dtMs;
    if (b.trainProgress >= def.trainMs) {
      b.trainProgress = 0;
      b.trainQueue.shift();
      const spawn = spawnUnit(
        world,
        kind,
        b.team,
        b.rally.x + (Math.random() * 20 - 10),
        b.rally.y + (Math.random() * 20 - 10),
      );
      if (!spawn) {
        teamState(world, b.team).forage += def.costForage * 0.5;
      }
    }
  }
}
