/**
 * Orders as data. A player's order is recorded with the simulation tick it takes
 * effect on, so the other player can receive it and apply it on the same tick.
 * Commands due on one tick always run in the same order, so both clients agree.
 */
import type { BuildingTypeId } from '../../data/buildings';
import type { BattlefieldTeam, BattlefieldUnit, BattlefieldWorld } from './battlefieldWorld';
import { moveUnitsForTeam, recordPlayerAction } from './battlefieldWorld';
import { placeBuilding } from './battlefieldBuildings';
import { toggleFormationUnit } from './battlefieldFormations';
import { toggleMutationUnit } from './battlefieldMutations';
import { toggleRageUnit } from './battlefieldRage';
import { findTarget } from './battlefieldCombat';
import { setUnitPath } from './battlefieldPathfinding';

interface OrderBase {
  team: BattlefieldTeam;
  unitIds: readonly number[];
}

export type BattleCommand =
  | (OrderBase & { kind: 'move'; x: number; y: number })
  | (OrderBase & { kind: 'gather'; nodeId: number })
  | (OrderBase & { kind: 'attack'; targetId: number })
  | (OrderBase & { kind: 'place'; buildingType: BuildingTypeId; x: number; y: number })
  | (OrderBase & { kind: 'stance'; stance: StanceId });

/** The stance keys: rage (Brutes), formation (Nobles) and mutation (Weirdos). */
export type StanceId = 'rage' | 'formation' | 'mutation';

const STANCE_TOGGLES: Record<StanceId, (u: BattlefieldUnit) => void> = {
  rage: toggleRageUnit,
  formation: toggleFormationUnit,
  mutation: toggleMutationUnit,
};

function targetKey(command: BattleCommand): string {
  switch (command.kind) {
    case 'move':
      return `${command.x}|${command.y}`;
    case 'gather':
      return `${command.nodeId}`;
    case 'attack':
      return `${command.targetId}`;
    case 'place':
      return `${command.buildingType}|${command.x}|${command.y}`;
    case 'stance':
      return command.stance;
  }
}

function sortKey(command: BattleCommand): string {
  return `${command.team}|${command.kind}|${targetKey(command)}|${[...command.unitIds].sort((a, b) => a - b).join(',')}`;
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

/** The living units of the command's own team that it names. */
function commandedUnits(world: BattlefieldWorld, command: BattleCommand) {
  const wanted = new Set(command.unitIds);
  return world.units.filter(
    (u) => u.team === command.team && wanted.has(u.id) && u.hp > 0,
  );
}

/** Applies one order. Only living units of the command's own team can be ordered. */
export function applyBattleCommand(world: BattlefieldWorld, command: BattleCommand): void {
  switch (command.kind) {
    case 'move':
      moveUnitsForTeam(world, command.team, commandedUnits(world, command), command.x, command.y);
      return;
    case 'gather': {
      const node = world.nodes.find((n) => n.id === command.nodeId && n.remaining > 0);
      if (!node) return;
      let ordered = 0;
      for (const u of commandedUnits(world, command)) {
        if (!u.canGather) continue;
        u.attackTargetId = null;
        u.attackMove = false;
        u.gatherNodeId = node.id;
        setUnitPath(world, u, { x: node.x, y: node.y });
        ordered += 1;
      }
      if (ordered > 0) recordPlayerAction(world);
      return;
    }
    case 'place':
      placeBuilding(world, command.team, command.buildingType, command.x, command.y);
      return;
    case 'stance': {
      const toggle = STANCE_TOGGLES[command.stance];
      for (const u of commandedUnits(world, command)) toggle(u);
      return;
    }
    case 'attack': {
      const target = findTarget(world, command.targetId);
      if (!target || target.hp <= 0 || target.team === command.team || target.team === 'neutral') return;
      let ordered = 0;
      for (const u of commandedUnits(world, command)) {
        u.path = [];
        u.moveTarget = null;
        u.gatherNodeId = null;
        u.attackMove = false;
        u.attackTargetId = target.id;
        ordered += 1;
      }
      if (ordered > 0) recordPlayerAction(world);
      return;
    }
  }
}

/** Applies every command due on `tick`, in the fixed order. Call before the tick's simulation step. */
export function applyDueCommands(
  world: BattlefieldWorld,
  schedule: CommandSchedule,
  tick: number,
): void {
  for (const command of schedule.takeDue(tick)) applyBattleCommand(world, command);
}
