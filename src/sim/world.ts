/**
 * World facade — creates match state and ticks gameplay modules.
 * Presentation stays out of this file.
 */
import { BUILD, MAP, RESOURCES, WARDSTONE } from '../config/balance';
import { tickAi } from '../ai/aiOpponent';
import { autoAcquire, issueAttack, tickCombat } from '../combat/combatSystem';
import { spawnBuilding, tickConstruction, tryPlaceBarracks } from '../construction/constructionSystem';
import { issueMove, setUnitGoal, tickMovement } from '../movement/movementSystem';
import { enqueueTrain, spawnUnit, tickProduction } from '../production/productionSystem';
import {
  canAfford,
  countOwnedWardstones,
  keepOf,
  pay,
  teamState,
  tickAura,
  tickGathering,
  tickHoldTimers,
  tickWardstones,
} from '../resources/resourceSystem';
import {
  clearSelection,
  selectAllOfKind,
  selectAt,
  selectInRect,
  selectedBuilding,
  selectedUnits,
} from '../selection/selectionSystem';
import { dist } from './math';
import type { Team, Unit, World } from './types';
import type { UnitKind } from '../config/balance';

export {
  canAfford,
  clearSelection,
  countOwnedWardstones,
  enqueueTrain,
  keepOf,
  pay,
  selectAllOfKind,
  selectAt,
  selectInRect,
  selectedBuilding,
  selectedUnits,
  spawnUnit,
  teamState,
  tickAi,
  tryPlaceBarracks,
};

export function createWorld(): World {
  const world: World = {
    nextId: 1,
    units: [],
    buildings: [],
    forageNodes: [],
    wardstones: [],
    player: {
      forage: RESOURCES.startingForage,
      aura: RESOURCES.startingAura,
      holdTimerMs: 0,
    },
    enemy: {
      forage: RESOURCES.startingForage,
      aura: RESOURCES.startingAura,
      holdTimerMs: 0,
    },
    outcome: { kind: 'playing' },
    elapsedMs: 0,
    coach: 'Select Lantern Scouts, then gather berries. Build a Barracks!',
  };

  spawnBuilding(world, 'keep', 'player', 220, MAP.height - 220, 36, true);
  spawnBuilding(world, 'keep', 'enemy', MAP.width - 220, 220, 36, true);

  const stones = [
    { x: MAP.width * 0.5, y: MAP.height * 0.5 },
    { x: MAP.width * 0.28, y: MAP.height * 0.38 },
    { x: MAP.width * 0.72, y: MAP.height * 0.62 },
    { x: MAP.width * 0.35, y: MAP.height * 0.72 },
    { x: MAP.width * 0.65, y: MAP.height * 0.28 },
  ];
  for (const s of stones) {
    world.wardstones.push({
      id: world.nextId++,
      x: s.x,
      y: s.y,
      owner: 'neutral',
      captureTeam: null,
      captureProgress: 0,
      radius: 28,
    });
  }

  const forageSpots = [
    { x: 360, y: MAP.height - 360 },
    { x: 280, y: MAP.height - 480 },
    { x: 480, y: MAP.height - 280 },
    { x: 420, y: MAP.height - 520 },
    { x: MAP.width - 360, y: 360 },
    { x: MAP.width - 280, y: 480 },
    { x: MAP.width - 480, y: 280 },
    { x: MAP.width - 420, y: 520 },
    { x: MAP.width * 0.45, y: MAP.height * 0.55 },
    { x: MAP.width * 0.55, y: MAP.height * 0.45 },
    { x: MAP.width * 0.22, y: MAP.height * 0.5 },
    { x: MAP.width * 0.78, y: MAP.height * 0.5 },
  ];
  for (const f of forageSpots) {
    world.forageNodes.push({
      id: world.nextId++,
      x: f.x,
      y: f.y,
      remaining: RESOURCES.forageNodeAmount,
      radius: 18,
    });
  }

  for (let i = 0; i < 4; i++) {
    spawnUnit(world, 'scout', 'player', 260 + i * 28, MAP.height - 280);
  }
  for (let i = 0; i < 4; i++) {
    spawnUnit(world, 'scout', 'enemy', MAP.width - 260 - i * 28, 280);
  }

  return world;
}

export function issueMoveOrAttack(
  world: World,
  team: Team,
  x: number,
  y: number,
): void {
  const units = selectedUnits(world, team);
  if (units.length === 0) return;

  let enemy: Unit | { id: number; x: number; y: number; radius: number; team: Team } | null =
    null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (u.team === team) continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 18 && d < bestD) {
      enemy = u;
      bestD = d;
    }
  }
  for (const b of world.buildings) {
    if (b.team === team || b.team === 'neutral') continue;
    const d = dist(b.x, b.y, x, y);
    if (d <= b.radius + 22 && d < bestD) {
      enemy = b;
      bestD = d;
    }
  }

  let node = null;
  if (!enemy) {
    for (const n of world.forageNodes) {
      if (n.remaining <= 0) continue;
      if (dist(n.x, n.y, x, y) <= n.radius + 22) {
        node = n;
        break;
      }
    }
  }

  let stone = null;
  if (!enemy && !node) {
    for (const w of world.wardstones) {
      if (dist(w.x, w.y, x, y) <= WARDSTONE.captureRange) {
        stone = w;
        break;
      }
    }
  }

  if (enemy) {
    issueAttack(world, team, enemy as Unit);
    return;
  }

  units.forEach((u, i) => {
    const ox = (i % 3) * 18 - 18;
    const oy = Math.floor(i / 3) * 18;
    u.targetId = null;
    if (node && u.canGather) {
      u.gatherNodeId = node.id;
      setUnitGoal(world, u, { x: node.x + ox, y: node.y + oy });
    } else if (stone) {
      u.gatherNodeId = null;
      setUnitGoal(world, u, { x: stone.x + ox * 0.5, y: stone.y + oy * 0.5 });
    } else {
      u.gatherNodeId = null;
    }
  });

  if (!node && !stone && (team === 'player' || team === 'enemy')) {
    issueMove(world, team, x, y);
  }
}

export function tick(world: World, dtMs: number): void {
  if (world.outcome.kind !== 'playing') return;
  const dt = Math.min(dtMs, 50) / 1000;
  world.elapsedMs += dtMs;

  tickAura(world, dt);
  tickConstruction(world, dtMs);
  tickProduction(world, dtMs);
  tickGathering(world);
  tickCombat(world, dtMs);

  for (const u of world.units) {
    if (
      u.targetId == null &&
      (!u.canGather || (u.gatherNodeId == null && u.carrying <= 0))
    ) {
      autoAcquire(world, u);
    }
  }

  tickMovement(world, dt);
  tickWardstones(world, dtMs);
  tickHoldTimers(world, dtMs);

  const playerKeep = keepOf(world, 'player');
  const enemyKeep = keepOf(world, 'enemy');
  if (!enemyKeep || enemyKeep.hp <= 0) {
    world.outcome = { kind: 'win', reason: 'keep' };
    world.coach = 'Victory! The rival Keep falls.';
  } else if (!playerKeep || playerKeep.hp <= 0) {
    world.outcome = { kind: 'loss', reason: 'keep' };
    world.coach = 'Defeat — your Keep was destroyed. Rematch when ready.';
  } else if (world.player.holdTimerMs >= WARDSTONE.holdWinMs) {
    world.outcome = { kind: 'win', reason: 'wardstones' };
    world.coach = 'Victory! Wardstones blaze for Sunkeep Kin.';
  } else if (world.enemy.holdTimerMs >= WARDSTONE.holdWinMs) {
    world.outcome = { kind: 'loss', reason: 'wardstones' };
    world.coach = 'Defeat — the rival held the Wardstones. Rematch when ready.';
  }

  if (
    world.outcome.kind === 'playing' &&
    world.elapsedMs > 8000 &&
    world.player.forage >= BUILD.barracksCostForage &&
    !world.buildings.some((b) => b.team === 'player' && b.kind === 'barracks')
  ) {
    world.coach =
      'Enough forage! Tap Build Barracks, then place it near your Keep.';
  }
}

// silence unused if tree-shaken oddly
void 0 as unknown as UnitKind;
