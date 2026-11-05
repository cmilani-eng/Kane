/** Gameplay — building construction. */
import { BUILD, MAP } from '../../config/balance';
import { dist } from '../math';
import type { Building, Team, World } from '../types';
import { canAfford, pay } from '../resources/resourceSystem';

export function spawnBuilding(
  world: World,
  kind: Building['kind'],
  team: Team,
  x: number,
  y: number,
  radius: number,
  complete: boolean,
): Building {
  const maxHp = kind === 'keep' ? BUILD.keepHp : BUILD.barracksHp;
  const b: Building = {
    id: world.nextId++,
    kind,
    team,
    x,
    y,
    hp: maxHp,
    maxHp,
    buildProgress: complete ? 1 : 0,
    trainQueue: [],
    trainProgress: 0,
    rally: {
      x: x + (team === 'player' ? 80 : -80),
      y: y + (team === 'player' ? -60 : 60),
    },
    selected: false,
    radius,
  };
  world.buildings.push(b);
  return b;
}

export function tryPlaceBarracks(
  world: World,
  team: Team,
  x: number,
  y: number,
): boolean {
  if (!canAfford(world, team, BUILD.barracksCostForage, BUILD.barracksCostAura)) {
    return false;
  }
  for (const b of world.buildings) {
    if (dist(b.x, b.y, x, y) < 90) return false;
  }
  if (x < 60 || y < 60 || x > MAP.width - 60 || y > MAP.height - 60) return false;
  if (!pay(world, team, BUILD.barracksCostForage, BUILD.barracksCostAura)) return false;
  spawnBuilding(world, 'barracks', team, x, y, 30, false);
  if (team === 'player') {
    world.coach = 'Barracks building! Select it when ready to train Kin Blades.';
  }
  return true;
}

export function tickConstruction(world: World, dtMs: number): void {
  for (const b of world.buildings) {
    if (b.buildProgress < 1) {
      b.buildProgress = Math.min(1, b.buildProgress + dtMs / BUILD.barracksBuildMs);
    }
  }
}
