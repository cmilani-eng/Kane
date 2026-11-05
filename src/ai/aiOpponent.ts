/** Simple solo-builder AI opponent — local sim only. */
import { AI, BUILD, UNITS } from '../config/balance';
import { tryPlaceBarracks } from '../construction/constructionSystem';
import { dist } from '../sim/math';
import type { World } from '../sim/types';
import { enqueueTrain } from '../production/productionSystem';
import {
  countOwnedWardstones,
  keepOf,
  nearestForage,
} from '../resources/resourceSystem';
import { setUnitGoal } from '../movement/movementSystem';

export function tickAi(world: World, dtMs: number, acc: { t: number }): void {
  if (world.outcome.kind !== 'playing') return;
  acc.t += dtMs;
  if (acc.t < AI.thinkMs) return;
  acc.t = 0;

  const enemy = 'enemy' as const;
  const state = world.enemy;
  const keep = keepOf(world, enemy);
  if (!keep) return;

  const scouts = world.units.filter((u) => u.team === enemy && u.kind === 'scout');
  for (const s of scouts) {
    if (s.gatherNodeId || s.carrying > 0 || s.targetId || s.moveTarget) continue;
    const node = nearestForage(world, s.x, s.y);
    if (node) {
      s.gatherNodeId = node.id;
      setUnitGoal(world, s, { x: node.x, y: node.y });
    }
  }

  const hasBarracks = world.buildings.some(
    (b) => b.team === enemy && b.kind === 'barracks',
  );
  if (!hasBarracks && state.forage >= BUILD.barracksCostForage) {
    tryPlaceBarracks(world, enemy, keep.x - 120, keep.y + 100);
  }

  const barracks = world.buildings.find(
    (b) => b.team === enemy && b.kind === 'barracks' && b.buildProgress >= 1,
  );
  if (barracks && barracks.trainQueue.length === 0) {
    const army = world.units.filter(
      (u) => u.team === enemy && u.kind !== 'scout',
    ).length;
    if (army < AI.attackArmySize + 2) {
      if (
        state.aura >= UNITS.ranged.costAura &&
        state.forage >= UNITS.ranged.costForage
      ) {
        enqueueTrain(world, barracks, 'ranged');
      } else {
        enqueueTrain(world, barracks, 'melee');
      }
    }
  }

  const targetStone = world.wardstones
    .filter((w) => w.owner !== enemy)
    .sort(
      (a, b) => dist(a.x, a.y, keep.x, keep.y) - dist(b.x, b.y, keep.x, keep.y),
    )[0];
  if (targetStone) {
    const capturers = world.units.filter(
      (u) =>
        u.team === enemy &&
        !u.carrying &&
        (u.kind !== 'scout' || countOwnedWardstones(world, enemy) < 2),
    );
    const free = capturers
      .filter((u) => !u.targetId && !u.moveTarget)
      .slice(0, 3);
    for (const u of free) {
      if (u.kind === 'scout' && u.gatherNodeId) continue;
      u.gatherNodeId = null;
      setUnitGoal(world, u, { x: targetStone.x, y: targetStone.y });
    }
  }

  const army = world.units.filter((u) => u.team === enemy && u.kind !== 'scout');
  const playerKeep = keepOf(world, 'player');
  if (army.length >= AI.attackArmySize && playerKeep) {
    for (const u of army) {
      if (!u.targetId) {
        u.targetId = playerKeep.id;
        u.moveTarget = null;
        u.path = [];
      }
    }
  }
}
