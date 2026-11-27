/**
 * Economy — gather Gold / Magic Crystals from nodes, deposit at stockpile.
 * Gameplay-only (no Phaser).
 */
import type { ResourceId } from '../../data/resources';
import { getSkirmishMap } from '../../data/skirmishMaps';
import { dist } from '../math';
import { getAiDifficulty } from './aiDifficulty';
import {
  spawnDepositFx,
  spawnGatherFx,
} from './battlefieldEconomyFx';
import { setUnitPath } from './battlefieldPathfinding';
import {
  recordPlayerAction,
  type BattlefieldTeam,
  type BattlefieldUnit,
  type BattlefieldWorld,
  type ResourceNode,
  type Stockpile,
} from './battlefieldWorld';

export const GATHER = {
  range: 40,
  depositRange: 56,
  amountPerTrip: 8,
} as const;

export function findNodeAt(
  world: BattlefieldWorld,
  x: number,
  y: number,
): ResourceNode | null {
  let best: ResourceNode | null = null;
  let bestD = Infinity;
  for (const n of world.nodes) {
    if (n.remaining <= 0) continue;
    const d = dist(n.x, n.y, x, y);
    if (d <= n.radius + 10 && d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

export function stockpileOf(
  world: BattlefieldWorld,
  team: BattlefieldTeam,
): Stockpile | null {
  return world.stockpiles.find((s) => s.team === team) ?? null;
}

export function walletOf(world: BattlefieldWorld, team: BattlefieldTeam) {
  return team === 'player' ? world.wallet : world.enemyWallet;
}

/** Selected gatherers → harvest this node (clears attack). */
export function issueGatherSelected(
  world: BattlefieldWorld,
  node: ResourceNode,
): void {
  let ordered = 0;
  for (const u of world.units) {
    if (u.team !== 'player' || !u.selected || !u.canGather) continue;
    u.attackTargetId = null;
    u.attackMove = false;
    u.gatherNodeId = node.id;
    setUnitPath(world, u, { x: node.x, y: node.y });
    ordered += 1;
  }
  if (ordered > 0) recordPlayerAction(world);
}

function setGoal(
  world: BattlefieldWorld,
  u: BattlefieldUnit,
  x: number,
  y: number,
): void {
  setUnitPath(world, u, { x, y });
}

export function tickBattlefieldEconomy(world: BattlefieldWorld): void {
  for (const u of world.units) {
    if (!u.canGather) continue;

    // Carrying → return to stockpile
    if (u.carrying > 0 && u.carryingResource) {
      const pile = stockpileOf(world, u.team);
      if (!pile) continue;
      if (dist(u.x, u.y, pile.x, pile.y) <= GATHER.depositRange) {
        let amt = u.carrying;
        if (u.team === 'enemy') {
          const rate = getAiDifficulty(world.aiDifficulty).economyRate;
          amt = Math.max(1, Math.round(amt * rate));
        }
        const deposited = u.carryingResource;
        walletOf(world, u.team)[u.carryingResource] += amt;
        if (u.team === 'player') {
          if (deposited === 'gold') world.playerGoldGathered += amt;
          else world.playerCrystalsGathered += amt;
        }
        spawnDepositFx(world, deposited, pile.x, pile.y - 8);
        u.carrying = 0;
        u.carryingResource = null;
        if (u.gatherNodeId != null) {
          const node = world.nodes.find((n) => n.id === u.gatherNodeId);
          if (node && node.remaining > 0) {
            setGoal(world, u, node.x, node.y);
          } else {
            u.gatherNodeId = null;
            u.path = [];
            u.moveTarget = null;
          }
        }
      } else if (!u.moveTarget && u.path.length === 0) {
        setGoal(world, u, pile.x, pile.y);
      }
      continue;
    }

    // Assigned to node → gather when in range
    if (u.gatherNodeId != null) {
      const node = world.nodes.find((n) => n.id === u.gatherNodeId);
      if (!node || node.remaining <= 0) {
        u.gatherNodeId = null;
        u.path = [];
        u.moveTarget = null;
        continue;
      }
      if (dist(u.x, u.y, node.x, node.y) <= GATHER.range) {
        const take = Math.min(
          GATHER.amountPerTrip,
          u.carryCapacity - u.carrying,
          node.remaining,
        );
        if (take > 0) {
          node.remaining -= take;
          u.carrying += take;
          u.carryingResource = node.resourceId;
          spawnGatherFx(world, node.resourceId, node.x, node.y - 6);
          u.path = [];
          u.moveTarget = null;
          const pile = stockpileOf(world, u.team);
          if (pile) setGoal(world, u, pile.x, pile.y);
        }
      } else if (!u.moveTarget && u.path.length === 0) {
        setGoal(world, u, node.x, node.y);
      }
    }
  }
}

export function createDefaultNodes(
  world: BattlefieldWorld,
  spots?: Array<{
    x: number;
    y: number;
    resourceId: ResourceId;
    amount: number;
  }>,
): void {
  const list = spots ?? getSkirmishMap('crossing').nodes;
  for (const s of list) {
    world.nodes.push({
      id: world.nextId++,
      x: s.x,
      y: s.y,
      radius: 18,
      resourceId: s.resourceId,
      remaining: s.amount,
      maxAmount: s.amount,
    });
  }
}
