/** Gameplay — forage gather + aura from Wardstones. */
import { RESOURCES, WARDSTONE } from '../../config/balance';
import { dist } from '../math';
import type { ForageNode, Team, World } from '../types';
import { setUnitGoal } from '../units/movementSystem';

export function teamState(world: World, team: Team) {
  return team === 'player' ? world.player : world.enemy;
}

export function countOwnedWardstones(world: World, team: Team): number {
  return world.wardstones.filter((w) => w.owner === team).length;
}

export function canAfford(
  world: World,
  team: Team,
  forage: number,
  aura: number,
): boolean {
  const s = teamState(world, team);
  return s.forage >= forage && s.aura >= aura;
}

export function pay(
  world: World,
  team: Team,
  forage: number,
  aura: number,
): boolean {
  if (!canAfford(world, team, forage, aura)) return false;
  const s = teamState(world, team);
  s.forage -= forage;
  s.aura -= aura;
  return true;
}

export function keepOf(world: World, team: Team) {
  return world.buildings.find((b) => b.team === team && b.kind === 'keep');
}

function depositPoint(world: World, team: Team) {
  const keep = keepOf(world, team);
  return keep ? { x: keep.x, y: keep.y } : { x: 0, y: 0 };
}

export function tickAura(world: World, dt: number): void {
  for (const team of ['player', 'enemy'] as Team[]) {
    const owned = countOwnedWardstones(world, team);
    teamState(world, team).aura +=
      owned * RESOURCES.auraPerWardstonePerSec * dt;
  }
}

export function tickGathering(world: World): void {
  for (const u of world.units) {
    if (!u.canGather) continue;

    if (u.gatherNodeId != null && u.carrying <= 0) {
      const node = world.forageNodes.find((n) => n.id === u.gatherNodeId);
      if (!node || node.remaining <= 0) {
        u.gatherNodeId = null;
        u.moveTarget = null;
        u.path = [];
      } else if (dist(u.x, u.y, node.x, node.y) <= RESOURCES.gatherRange) {
        const take = Math.min(RESOURCES.foragePerTrip, node.remaining);
        node.remaining -= take;
        u.carrying = take;
        setUnitGoal(world, u, depositPoint(world, u.team));
      } else if (!u.moveTarget) {
        setUnitGoal(world, u, { x: node.x, y: node.y });
      }
    } else if (u.carrying > 0) {
      const dep = depositPoint(world, u.team);
      if (dist(u.x, u.y, dep.x, dep.y) <= RESOURCES.depositRange) {
        teamState(world, u.team).forage += u.carrying;
        u.carrying = 0;
        if (u.gatherNodeId != null) {
          const node = world.forageNodes.find((n) => n.id === u.gatherNodeId);
          if (node && node.remaining > 0) {
            setUnitGoal(world, u, { x: node.x, y: node.y });
          } else {
            u.gatherNodeId = null;
            u.moveTarget = null;
            u.path = [];
          }
        }
      } else if (!u.moveTarget) {
        setUnitGoal(world, u, dep);
      }
    }
  }
}

export function tickWardstones(world: World, dtMs: number): void {
  for (const w of world.wardstones) {
    const present: Record<Team, number> = { player: 0, enemy: 0, neutral: 0 };
    for (const u of world.units) {
      if (dist(u.x, u.y, w.x, w.y) <= WARDSTONE.captureRange) present[u.team]++;
    }
    let contester: Team | null = null;
    if (present.player > 0 && present.enemy === 0) contester = 'player';
    else if (present.enemy > 0 && present.player === 0) contester = 'enemy';

    if (contester && contester !== w.owner) {
      if (w.captureTeam !== contester) {
        w.captureTeam = contester;
        w.captureProgress = 0;
      }
      w.captureProgress = Math.min(
        1,
        w.captureProgress + dtMs / WARDSTONE.captureMs,
      );
      if (w.captureProgress >= 1) {
        w.owner = contester;
        w.captureProgress = 0;
        w.captureTeam = null;
        if (contester === 'player') {
          world.coach = `Wardstone claimed! Hold ${WARDSTONE.holdNeeded} to win, or raze their Keep.`;
        }
      }
    } else if (!contester) {
      w.captureTeam = null;
      w.captureProgress = Math.max(
        0,
        w.captureProgress - dtMs / WARDSTONE.captureMs,
      );
    }
  }
}

export function tickHoldTimers(world: World, dtMs: number): void {
  for (const team of ['player', 'enemy'] as Team[]) {
    const owned = countOwnedWardstones(world, team);
    const s = teamState(world, team);
    if (owned >= WARDSTONE.holdNeeded) s.holdTimerMs += dtMs;
    else s.holdTimerMs = Math.max(0, s.holdTimerMs - dtMs * 2);
  }
}

export function nearestForage(
  world: World,
  x: number,
  y: number,
): ForageNode | null {
  let best: ForageNode | null = null;
  let bestD = Infinity;
  for (const n of world.forageNodes) {
    if (n.remaining <= 0) continue;
    const d = dist(n.x, n.y, x, y);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}
