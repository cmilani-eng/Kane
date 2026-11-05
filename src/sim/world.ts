import {
  AI,
  BUILD,
  COMBAT,
  FACTION,
  MAP,
  RESOURCES,
  UNITS,
  WARDSTONE,
  type UnitKind,
} from '../config/balance';
import { flags } from '../config/flags';
import type {
  Building,
  ForageNode,
  Team,
  Unit,
  Vec2,
  Wardstone,
  World,
} from './types';

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}

function moveToward(
  x: number,
  y: number,
  tx: number,
  ty: number,
  speed: number,
  dt: number,
): Vec2 {
  const d = dist(x, y, tx, ty);
  if (d < 1) return { x: tx, y: ty };
  const step = Math.min(d, speed * dt);
  return { x: x + ((tx - x) / d) * step, y: y + ((ty - y) / d) * step };
}

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
    coach: 'Tap your Lantern Scouts, then tap berries to gather. Build a Barracks!',
  };

  const keepR = 36;
  spawnBuilding(world, 'keep', 'player', 220, MAP.height - 220, keepR, true);
  spawnBuilding(world, 'keep', 'enemy', MAP.width - 220, 220, keepR, true);

  // Classic 5-node Wardstone layout
  const stones: Vec2[] = [
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

  // Forage clusters near each keep + mid
  const forageSpots: Vec2[] = [
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

  // Starting scouts
  for (let i = 0; i < 4; i++) {
    spawnUnit(world, 'scout', 'player', 260 + i * 28, MAP.height - 280);
  }
  for (let i = 0; i < 4; i++) {
    spawnUnit(world, 'scout', 'enemy', MAP.width - 260 - i * 28, 280);
  }

  return world;
}

function spawnBuilding(
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

export function teamState(world: World, team: Team) {
  return team === 'player' ? world.player : world.enemy;
}

export function countOwnedWardstones(world: World, team: Team): number {
  return world.wardstones.filter((w) => w.owner === team).length;
}

export function clearSelection(world: World): void {
  for (const u of world.units) u.selected = false;
  for (const b of world.buildings) b.selected = false;
}

export function selectInRect(
  world: World,
  team: Team,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  clearSelection(world);
  let any = false;
  for (const u of world.units) {
    if (u.team !== team) continue;
    if (u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
      u.selected = true;
      any = true;
    }
  }
  if (!any) {
    for (const b of world.buildings) {
      if (b.team !== team || b.buildProgress < 1) continue;
      if (b.x >= minX && b.x <= maxX && b.y >= minY && b.y <= maxY) {
        b.selected = true;
      }
    }
  }
}

export function selectAt(world: World, team: Team, x: number, y: number): boolean {
  clearSelection(world);
  // Prefer units
  let best: Unit | null = null;
  let bestD = Infinity;
  for (const u of world.units) {
    if (u.team !== team) continue;
    const d = dist(u.x, u.y, x, y);
    if (d <= u.radius + 16 && d < bestD) {
      best = u;
      bestD = d;
    }
  }
  if (best) {
    best.selected = true;
    return true;
  }
  for (const b of world.buildings) {
    if (b.team !== team || b.buildProgress < 1) continue;
    if (dist(b.x, b.y, x, y) <= b.radius + 20) {
      b.selected = true;
      return true;
    }
  }
  return false;
}

export function selectedUnits(world: World, team: Team): Unit[] {
  return world.units.filter((u) => u.team === team && u.selected);
}

export function selectedBuilding(world: World, team: Team): Building | null {
  return world.buildings.find((b) => b.team === team && b.selected) ?? null;
}

export function issueMoveOrAttack(
  world: World,
  team: Team,
  x: number,
  y: number,
): void {
  const units = selectedUnits(world, team);
  if (units.length === 0) return;

  // Attack enemy under cursor?
  let enemy: Unit | Building | null = null;
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

  // Gather order for scouts
  let node: ForageNode | null = null;
  if (!enemy) {
    for (const n of world.forageNodes) {
      if (n.remaining <= 0) continue;
      if (dist(n.x, n.y, x, y) <= n.radius + 22) {
        node = n;
        break;
      }
    }
  }

  // Capture wardstone
  let stone: Wardstone | null = null;
  if (!enemy && !node) {
    for (const w of world.wardstones) {
      if (dist(w.x, w.y, x, y) <= WARDSTONE.captureRange) {
        stone = w;
        break;
      }
    }
  }

  units.forEach((u, i) => {
    const ox = (i % 3) * 18 - 18;
    const oy = Math.floor(i / 3) * 18;
    u.targetId = null;
    u.gatherNodeId = null;
    if (enemy) {
      u.targetId = enemy.id;
      u.moveTarget = null;
    } else if (node && u.canGather) {
      u.gatherNodeId = node.id;
      u.moveTarget = { x: node.x + ox, y: node.y + oy };
    } else if (stone) {
      u.moveTarget = { x: stone.x + ox * 0.5, y: stone.y + oy * 0.5 };
    } else {
      u.moveTarget = { x: x + ox, y: y + oy };
    }
  });
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

export function pay(world: World, team: Team, forage: number, aura: number): boolean {
  if (!canAfford(world, team, forage, aura)) return false;
  const s = teamState(world, team);
  s.forage -= forage;
  s.aura -= aura;
  return true;
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
  // Keep some distance from other buildings
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

export function keepOf(world: World, team: Team): Building | undefined {
  return world.buildings.find((b) => b.team === team && b.kind === 'keep');
}

function findById(world: World, id: EntityIdLike): Unit | Building | null {
  return (
    world.units.find((u) => u.id === id) ??
    world.buildings.find((b) => b.id === id) ??
    null
  );
}

type EntityIdLike = number;

function depositPoint(world: World, team: Team): Vec2 {
  const keep = keepOf(world, team);
  if (keep) return { x: keep.x, y: keep.y };
  return { x: 0, y: 0 };
}

export function tickWorld(world: World, dtMs: number): void {
  if (world.outcome.kind !== 'playing') return;
  const dt = Math.min(dtMs, 50) / 1000;
  world.elapsedMs += dtMs;

  // Aura income
  for (const team of ['player', 'enemy'] as Team[]) {
    const owned = countOwnedWardstones(world, team);
    teamState(world, team).aura +=
      owned * RESOURCES.auraPerWardstonePerSec * dt;
  }

  // Building construction + training
  for (const b of world.buildings) {
    if (b.buildProgress < 1) {
      b.buildProgress = Math.min(1, b.buildProgress + dtMs / BUILD.barracksBuildMs);
      continue;
    }
    if (b.kind === 'barracks' && b.trainQueue.length > 0) {
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
          // refund soft
          teamState(world, b.team).forage += def.costForage * 0.5;
        }
      }
    }
  }

  // Units
  for (const u of [...world.units]) {
    u.attackCd = Math.max(0, u.attackCd - dtMs);

    // Gathering
    if (u.canGather && u.gatherNodeId != null && u.carrying <= 0) {
      const node = world.forageNodes.find((n) => n.id === u.gatherNodeId);
      if (!node || node.remaining <= 0) {
        u.gatherNodeId = null;
        u.moveTarget = null;
      } else if (dist(u.x, u.y, node.x, node.y) <= RESOURCES.gatherRange) {
        const take = Math.min(RESOURCES.foragePerTrip, node.remaining);
        node.remaining -= take;
        u.carrying = take;
        const dep = depositPoint(world, u.team);
        u.moveTarget = { x: dep.x, y: dep.y };
      } else {
        u.moveTarget = { x: node.x, y: node.y };
      }
    } else if (u.canGather && u.carrying > 0) {
      const dep = depositPoint(world, u.team);
      if (dist(u.x, u.y, dep.x, dep.y) <= RESOURCES.depositRange) {
        teamState(world, u.team).forage += u.carrying;
        u.carrying = 0;
        if (u.gatherNodeId != null) {
          const node = world.forageNodes.find((n) => n.id === u.gatherNodeId);
          if (node && node.remaining > 0) {
            u.moveTarget = { x: node.x, y: node.y };
          } else {
            u.gatherNodeId = null;
            u.moveTarget = null;
          }
        }
      } else {
        u.moveTarget = { x: dep.x, y: dep.y };
      }
    }

    // Combat targeting
    if (u.targetId != null) {
      const t = findById(world, u.targetId);
      if (!t || t.hp <= 0) {
        u.targetId = null;
      } else {
        const d = dist(u.x, u.y, t.x, t.y);
        const reach = u.range + ('radius' in t ? t.radius : 20);
        if (d > reach) {
          u.moveTarget = { x: t.x, y: t.y };
        } else {
          u.moveTarget = null;
          if (u.attackCd <= 0) {
            t.hp -= u.dmg;
            u.attackCd = COMBAT.attackCooldownMs;
            if (t.hp <= 0) {
              destroyEntity(world, t);
              u.targetId = null;
            }
          }
        }
      }
    } else if (!u.canGather || (u.gatherNodeId == null && u.carrying <= 0)) {
      // Auto-acquire nearby enemies when idle near combat
      autoAcquire(world, u);
    }

    if (u.moveTarget) {
      const next = moveToward(
        u.x,
        u.y,
        u.moveTarget.x,
        u.moveTarget.y,
        u.speed,
        dt,
      );
      u.x = clamp(next.x, 20, MAP.width - 20);
      u.y = clamp(next.y, 20, MAP.height - 20);
      if (dist(u.x, u.y, u.moveTarget.x, u.moveTarget.y) < 4) {
        u.moveTarget = null;
      }
    }
  }

  // Wardstone capture
  for (const w of world.wardstones) {
    const present: Record<Team, number> = {
      player: 0,
      enemy: 0,
      neutral: 0,
    };
    for (const u of world.units) {
      if (dist(u.x, u.y, w.x, w.y) <= WARDSTONE.captureRange) {
        present[u.team]++;
      }
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
      w.captureProgress = Math.max(0, w.captureProgress - dtMs / WARDSTONE.captureMs);
    }
  }

  // Hold timers
  for (const team of ['player', 'enemy'] as Team[]) {
    const owned = countOwnedWardstones(world, team);
    const s = teamState(world, team);
    if (owned >= WARDSTONE.holdNeeded) s.holdTimerMs += dtMs;
    else s.holdTimerMs = Math.max(0, s.holdTimerMs - dtMs * 2);
  }

  // Win / loss
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

  // Soft coach updates
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

function autoAcquire(world: World, u: Unit): void {
  let best: Unit | Building | null = null;
  let bestD = u.vision * 0.55;
  for (const o of world.units) {
    if (o.team === u.team) continue;
    const d = dist(u.x, u.y, o.x, o.y);
    if (d < bestD) {
      best = o;
      bestD = d;
    }
  }
  for (const b of world.buildings) {
    if (b.team === u.team || b.team === 'neutral') continue;
    const d = dist(u.x, u.y, b.x, b.y);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  if (best) u.targetId = best.id;
}

function destroyEntity(world: World, e: Unit | Building): void {
  const ui = world.units.findIndex((u) => u.id === e.id);
  if (ui >= 0) {
    world.units.splice(ui, 1);
    return;
  }
  const bi = world.buildings.findIndex((b) => b.id === e.id);
  if (bi >= 0) {
    const b = world.buildings[bi]!;
    if (b.kind === 'keep') {
      b.hp = 0;
    } else {
      world.buildings.splice(bi, 1);
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function tick(world: World, dtMs: number): void {
  tickWorld(world, dtMs);
}

export { FACTION, dist };

/** Simple AI brain */
export function tickAi(world: World, dtMs: number, acc: { t: number }): void {
  if (world.outcome.kind !== 'playing') return;
  acc.t += dtMs;
  if (acc.t < AI.thinkMs) return;
  acc.t = 0;

  const enemy = 'enemy' as const;
  const state = world.enemy;
  const keep = keepOf(world, enemy);
  if (!keep) return;

  // Assign idle scouts to gather
  const scouts = world.units.filter((u) => u.team === enemy && u.kind === 'scout');
  for (const s of scouts) {
    if (s.gatherNodeId || s.carrying > 0 || s.targetId || s.moveTarget) continue;
    const node = nearestForage(world, s.x, s.y);
    if (node) {
      s.gatherNodeId = node.id;
      s.moveTarget = { x: node.x, y: node.y };
    }
  }

  // Build barracks
  const hasBarracks = world.buildings.some(
    (b) => b.team === enemy && b.kind === 'barracks',
  );
  if (!hasBarracks && state.forage >= BUILD.barracksCostForage) {
    tryPlaceBarracks(world, enemy, keep.x - 120, keep.y + 100);
  }

  // Train
  const barracks = world.buildings.find(
    (b) => b.team === enemy && b.kind === 'barracks' && b.buildProgress >= 1,
  );
  if (barracks && barracks.trainQueue.length === 0) {
    const army = world.units.filter(
      (u) => u.team === enemy && u.kind !== 'scout',
    ).length;
    if (army < AI.attackArmySize + 2) {
      if (state.aura >= UNITS.ranged.costAura && state.forage >= UNITS.ranged.costForage) {
        enqueueTrain(world, barracks, 'ranged');
      } else {
        enqueueTrain(world, barracks, 'melee');
      }
    }
  }

  // Capture nearest neutral/player wardstone with a couple scouts or army
  const targetStone = world.wardstones
    .filter((w) => w.owner !== enemy)
    .sort(
      (a, b) =>
        dist(a.x, a.y, keep.x, keep.y) - dist(b.x, b.y, keep.x, keep.y),
    )[0];
  if (targetStone) {
    const capturers = world.units.filter(
      (u) =>
        u.team === enemy &&
        !u.carrying &&
        (u.kind !== 'scout' || countOwnedWardstones(world, enemy) < 2),
    );
    const free = capturers.filter((u) => !u.targetId && !u.moveTarget).slice(0, 3);
    for (const u of free) {
      if (u.kind === 'scout' && u.gatherNodeId) continue;
      u.gatherNodeId = null;
      u.moveTarget = { x: targetStone.x, y: targetStone.y };
    }
  }

  // Attack player keep when army ready
  const army = world.units.filter((u) => u.team === enemy && u.kind !== 'scout');
  const playerKeep = keepOf(world, 'player');
  if (army.length >= AI.attackArmySize && playerKeep) {
    for (const u of army) {
      if (!u.targetId) {
        u.targetId = playerKeep.id;
        u.moveTarget = null;
      }
    }
  }
}

function nearestForage(world: World, x: number, y: number): ForageNode | null {
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
