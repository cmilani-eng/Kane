/** Unit movement — consumes pathfinding waypoints. */
import { MAP } from '../config/balance';
import { findPath } from '../pathfinding/pathfinding';
import { clamp, dist, moveToward } from '../sim/math';
import type { Unit, Vec2, World } from '../sim/types';
import { selectedUnits } from '../selection/selectionSystem';

export function issueMove(world: World, team: 'player' | 'enemy', x: number, y: number): void {
  const units = selectedUnits(world, team);
  units.forEach((u, i) => {
    const ox = (i % 3) * 18 - 18;
    const oy = Math.floor(i / 3) * 18;
    const goal = { x: x + ox, y: y + oy };
    u.targetId = null;
    u.gatherNodeId = null;
    setUnitGoal(world, u, goal);
  });
}

export function setUnitGoal(world: World, u: Unit, goal: Vec2): void {
  u.path = findPath(world, { x: u.x, y: u.y }, goal);
  u.moveTarget = u.path.shift() ?? goal;
}

export function tickMovement(world: World, dt: number): void {
  for (const u of world.units) {
    if (!u.moveTarget) {
      if (u.path.length > 0) u.moveTarget = u.path.shift()!;
      else continue;
    }
    const next = moveToward(u.x, u.y, u.moveTarget.x, u.moveTarget.y, u.speed, dt);
    u.x = clamp(next.x, 20, MAP.width - 20);
    u.y = clamp(next.y, 20, MAP.height - 20);
    if (dist(u.x, u.y, u.moveTarget.x, u.moveTarget.y) < 4) {
      u.moveTarget = u.path.length > 0 ? u.path.shift()! : null;
    }
  }
}
