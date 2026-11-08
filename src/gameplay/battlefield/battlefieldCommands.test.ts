import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { createAiState } from './battlefieldAi';
import {
  applyBattleCommand,
  applyDueCommands,
  createCommandSchedule,
  type BattleCommand,
  type CommandSchedule,
} from './battlefieldCommands';
import { battlefieldHash } from './battlefieldHash';
import { stepBattlefieldSim } from './battlefieldSimStep';
import { createBattlefieldWorld, type BattlefieldWorld } from './battlefieldWorld';

function pvpWorld(seed = 7): BattlefieldWorld {
  const world = createBattlefieldWorld('brutes', 'normal', 'crossing', seed);
  world.pvp = true;
  return world;
}

function livingIds(world: BattlefieldWorld, team: 'player' | 'enemy'): number[] {
  return world.units.filter((u) => u.team === team && u.hp > 0).map((u) => u.id);
}

function moveAll(world: BattlefieldWorld, team: 'player' | 'enemy', x: number, y: number): BattleCommand {
  return { kind: 'move', team, unitIds: livingIds(world, team), x, y };
}

/** Runs fixed steps, applying each tick's commands first. Returns a hash every `every` steps. */
function play(world: BattlefieldWorld, schedule: CommandSchedule, steps: number, every = 20): string[] {
  const ai = createAiState('normal');
  const hashes: string[] = [];
  for (let tick = 0; tick < steps; tick++) {
    applyDueCommands(world, schedule, tick);
    stepBattlefieldSim(world, ai);
    if ((tick + 1) % every === 0) hashes.push(battlefieldHash(world));
  }
  return hashes;
}

function positions(world: BattlefieldWorld, team: 'player' | 'enemy'): string {
  return world.units
    .filter((u) => u.team === team)
    .map((u) => `${u.id}:${u.x.toFixed(3)},${u.y.toFixed(3)}`)
    .join(' ');
}

describe('battlefield commands', () => {
  it('a move order moves the ordered team and leaves the other team where it is', () => {
    const world = pvpWorld();
    const enemyBefore = positions(world, 'enemy');
    const playerBefore = positions(world, 'player');
    const schedule = createCommandSchedule();
    schedule.add(0, moveAll(world, 'player', world.units[0]!.x + 150, world.units[0]!.y));
    play(world, schedule, 120);
    expect(positions(world, 'player')).not.toBe(playerBefore);
    expect(positions(world, 'enemy')).toBe(enemyBefore);
  });

  it('a command cannot move the other team, even when it names their unit ids', () => {
    const world = pvpWorld();
    const enemyBefore = positions(world, 'enemy');
    applyBattleCommand(world, {
      kind: 'move',
      team: 'player',
      unitIds: livingIds(world, 'enemy'),
      x: 200,
      y: 200,
    });
    for (const u of world.units.filter((unit) => unit.team === 'enemy')) {
      expect(u.path).toEqual([]);
    }
    expect(positions(world, 'enemy')).toBe(enemyBefore);
  });

  it('a unit that has died is not moved', () => {
    const world = pvpWorld();
    const dead = world.units.find((u) => u.team === 'player')!;
    dead.hp = 0;
    const before = `${dead.x},${dead.y}`;
    applyBattleCommand(world, { kind: 'move', team: 'player', unitIds: [dead.id], x: 300, y: 300 });
    expect(`${dead.x},${dead.y}`).toBe(before);
    expect(dead.path).toEqual([]);
  });

  it('in a two-player match the AI stays off: the enemy team does not move without orders', () => {
    const world = pvpWorld();
    const enemyBefore = positions(world, 'enemy');
    play(world, createCommandSchedule(), 200);
    expect(positions(world, 'enemy')).toBe(enemyBefore);
  });

  it('a single-player match keeps the AI, so the enemy team does move on its own', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing', 7);
    const enemyBefore = positions(world, 'enemy');
    play(world, createCommandSchedule(), 400);
    expect(positions(world, 'enemy')).not.toBe(enemyBefore);
  });

  it('commands due on the same tick run in one fixed order, whatever order they were queued in', () => {
    const a = pvpWorld();
    const b = pvpWorld();
    const first = moveAll(a, 'player', 300, 300);
    const second: BattleCommand = {
      kind: 'move',
      team: 'enemy',
      unitIds: livingIds(a, 'enemy').slice(0, 2),
      x: 500,
      y: 500,
    };
    const forward = createCommandSchedule();
    forward.add(10, first);
    forward.add(10, second);
    const backward = createCommandSchedule();
    backward.add(10, second);
    backward.add(10, first);
    expect(play(a, forward, 200)).toEqual(play(b, backward, 200));
  });

  it('two clients with the same seed and the same schedule stay in step', () => {
    const a = pvpWorld();
    const b = pvpWorld();
    const scheduleA = createCommandSchedule();
    const scheduleB = createCommandSchedule();
    scheduleA.add(20, moveAll(a, 'player', 260, 240));
    scheduleA.add(60, moveAll(a, 'enemy', 380, 240));
    scheduleB.add(20, moveAll(b, 'player', 260, 240));
    scheduleB.add(60, moveAll(b, 'enemy', 380, 240));
    expect(play(a, scheduleA, 300)).toEqual(play(b, scheduleB, 300));
  });

  it('a command on a different tick leads to a different match', () => {
    const a = pvpWorld();
    const b = pvpWorld();
    const scheduleA = createCommandSchedule();
    const scheduleB = createCommandSchedule();
    scheduleA.add(20, moveAll(a, 'player', 260, 240));
    scheduleB.add(40, moveAll(b, 'player', 260, 240));
    expect(play(a, scheduleA, 200)).not.toEqual(play(b, scheduleB, 200));
  });

  it('a due command is removed from the schedule once it has been applied', () => {
    const world = pvpWorld();
    const schedule = createCommandSchedule();
    schedule.add(5, moveAll(world, 'player', 200, 200));
    expect(schedule.size()).toBe(1);
    applyDueCommands(world, schedule, 5);
    expect(schedule.size()).toBe(0);
    applyDueCommands(world, schedule, 5);
    expect(schedule.size()).toBe(0);
  });

  it('gather and attack orders run the same on both clients', () => {
    const a = pvpWorld();
    const b = pvpWorld();
    const gatherer = a.units.find((u) => u.team === 'player' && u.canGather)!.id;
    const node = a.nodes[0]!.id;
    const foe = a.units.find((u) => u.team === 'enemy')!.id;
    const others = livingIds(a, 'player').filter((id) => id !== gatherer);
    const orders: Array<[number, BattleCommand]> = [
      [20, { kind: 'gather', team: 'player', unitIds: [gatherer], nodeId: node }],
      [40, { kind: 'attack', team: 'player', unitIds: others, targetId: foe }],
    ];
    const scheduleA = createCommandSchedule();
    const scheduleB = createCommandSchedule();
    for (const [tick, command] of orders) {
      scheduleA.add(tick, command);
      scheduleB.add(tick, command);
    }
    expect(play(a, scheduleA, 300)).toEqual(play(b, scheduleB, 300));
  });

  it('a gather order sends the gatherer to the resource it names', () => {
    const world = pvpWorld();
    const node = world.nodes[0]!;
    const gatherer = world.units.find((u) => u.team === 'player' && u.canGather)!;
    applyBattleCommand(world, { kind: 'gather', team: 'player', unitIds: [gatherer.id], nodeId: node.id });
    expect(gatherer.gatherNodeId).toBe(node.id);
  });

  it('a gather order on a depleted resource does nothing', () => {
    const world = pvpWorld();
    const node = world.nodes[0]!;
    node.remaining = 0;
    const gatherer = world.units.find((u) => u.team === 'player' && u.canGather)!;
    applyBattleCommand(world, { kind: 'gather', team: 'player', unitIds: [gatherer.id], nodeId: node.id });
    expect(gatherer.gatherNodeId).toBeNull();
  });

  it('an attack order cannot target the ordering team', () => {
    const world = pvpWorld();
    const mine = world.units.find((u) => u.team === 'player')!;
    const ally = world.units.find((u) => u.team === 'player' && u.id !== mine.id)!;
    applyBattleCommand(world, { kind: 'attack', team: 'player', unitIds: [mine.id], targetId: ally.id });
    expect(mine.attackTargetId).not.toBe(ally.id);
  });

  it('a building placed on the shared tick lands the same way on both clients', () => {
    const a = pvpWorld();
    const b = pvpWorld();
    const keep = a.buildings.find((x) => x.team === 'player')!;
    let placed: BattleCommand | null = null;
    for (let dx = 120; dx <= 400 && !placed; dx += 20) {
      for (let dy = -200; dy <= 200 && !placed; dy += 20) {
        const command: BattleCommand = {
          kind: 'place',
          team: 'player',
          unitIds: [],
          buildingType: 'barracks',
          x: keep.x + dx,
          y: keep.y + dy,
        };
        const before = a.buildings.length;
        applyBattleCommand(a, command);
        if (a.buildings.length > before) placed = command;
      }
    }
    expect(placed).not.toBeNull();
    applyBattleCommand(b, placed!);
    expect(b.buildings.length).toBe(a.buildings.length);
    expect(battlefieldHash(a)).toBe(battlefieldHash(b));
  });

  it('a stance order locks the same units on both clients, and ignores the other team', () => {
    const a = pvpWorld();
    const b = pvpWorld();
    const mine = a.units.find((u) => u.team === 'player' && getUnitType(u.typeId).canRage)!;
    const order: BattleCommand = { kind: 'stance', team: 'player', unitIds: [mine.id], stance: 'rage' };
    applyBattleCommand(a, order);
    applyBattleCommand(b, order);
    expect(a.units.find((u) => u.id === mine.id)!.rageLocked).toBe(true);
    expect(b.units.find((u) => u.id === mine.id)!.rageLocked).toBe(true);
    applyBattleCommand(a, { kind: 'stance', team: 'enemy', unitIds: [mine.id], stance: 'rage' });
    expect(a.units.find((u) => u.id === mine.id)!.rageLocked).toBe(true);
  });
});
