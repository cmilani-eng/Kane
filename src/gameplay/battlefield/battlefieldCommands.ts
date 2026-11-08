/**
 * Orders as data. A player's order is recorded with the simulation tick it takes
 * effect on, so the other player can receive it and apply it on the same tick.
 * Commands due on one tick always run in the same order, so both clients agree.
 */
import type { BattlefieldTeam, BattlefieldWorld } from './battlefieldWorld';
import { moveUnitsForTeam } from './battlefieldWorld';

export type BattleCommand = {
  kind: 'move';
  team: BattlefieldTeam;
  unitIds: readonly number[];
  x: number;
  y: number;
};

function sortKey(command: BattleCommand): string {
  return `${command.team}|${command.kind}|${command.x}|${command.y}|${[...command.unitIds].sort((a, b) => a - b).join(',')}`;
}

/** A fixed order for commands that take effect on the same tick. Every client sorts the same way. */
export function compareBattleCommands(a: BattleCommand, b: BattleCommand): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

export interface CommandSchedule {
  /** Queues `command` to run on `tick`. */
  add(tick: number, command: BattleCommand): void;
  /** Removes and returns the commands for `tick`, in the fixed order. */
  takeDue(tick: number): BattleCommand[];
  size(): number;
}

export function createCommandSchedule(): CommandSchedule {
  const byTick = new Map<number, BattleCommand[]>();
  return {
    add(tick, command) {
      const list = byTick.get(tick) ?? [];
      list.push(command);
      byTick.set(tick, list);
    },
    takeDue(tick) {
      const list = byTick.get(tick) ?? [];
      byTick.delete(tick);
      return [...list].sort(compareBattleCommands);
    },
    size() {
      let total = 0;
      for (const list of byTick.values()) total += list.length;
      return total;
    },
  };
}

/** Applies one order. Only living units of the command's own team can be moved. */
export function applyBattleCommand(world: BattlefieldWorld, command: BattleCommand): void {
  if (command.kind !== 'move') return;
  const wanted = new Set(command.unitIds);
  const units = world.units.filter(
    (u) => u.team === command.team && wanted.has(u.id) && u.hp > 0,
  );
  moveUnitsForTeam(world, command.team, units, command.x, command.y);
}

/** Applies every command due on `tick`, in the fixed order. Call before the tick's simulation step. */
export function applyDueCommands(
  world: BattlefieldWorld,
  schedule: CommandSchedule,
  tick: number,
): void {
  for (const command of schedule.takeDue(tick)) applyBattleCommand(world, command);
}
