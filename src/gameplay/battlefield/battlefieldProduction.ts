/**
 * Unit production — train from completed buildings, spend Gold/Crystals.
 */
import { getBuildingType } from '../../data/buildings';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { SPECIES } from '../../data/speciesStub';
import { canAfford, pay } from './battlefieldBuildings';
import { walletOf } from './battlefieldEconomy';
import { setUnitPath } from './battlefieldPathfinding';
import {
  spawnUnit,
  type BattlefieldBuilding,
  type BattlefieldTeam,
  type BattlefieldUnit,
  type BattlefieldWorld,
} from './battlefieldWorld';

export function queueTrain(
  world: BattlefieldWorld,
  building: BattlefieldBuilding,
  typeId: UnitTypeId,
): boolean {
  if (!building.complete || building.hp <= 0) return false;
  const bdef = getBuildingType(building.typeId);
  if (!bdef.trains.includes(typeId)) return false;
  const udef = getUnitType(typeId);
  const wallet = walletOf(world, building.team);
  const cost = { gold: udef.costGold, magic_crystals: udef.costCrystals };
  if (!canAfford(wallet, cost)) return false;
  if (!pay(wallet, cost)) return false;
  building.trainQueue.push(typeId);
  return true;
}

export function tickProduction(world: BattlefieldWorld, dtMs: number): void {
  for (const b of world.buildings) {
    if (!b.complete || b.trainQueue.length === 0) {
      b.trainProgressMs = 0;
      continue;
    }
    const next = b.trainQueue[0]!;
    const def = getUnitType(next);
    b.trainProgressMs += dtMs;
    if (b.trainProgressMs >= def.trainMs) {
      b.trainQueue.shift();
      b.trainProgressMs = 0;
      spawnNear(world, b, next);
    }
  }
}

function spawnNear(
  world: BattlefieldWorld,
  b: BattlefieldBuilding,
  typeId: UnitTypeId,
): void {
  const def = getUnitType(typeId);
  const palette =
    SPECIES[def.speciesId]?.palette ??
    (b.team === 'player'
      ? { primary: 0x4a7a3a, accent: 0xd4782e }
      : { primary: 0x8a4a9a, accent: 0xc4a0e0 });
  const angle = Math.random() * Math.PI * 2;
  const dist = b.radius + 24;
  const u: BattlefieldUnit = spawnUnit(world, {
    team: b.team as BattlefieldTeam,
    typeId,
    x: b.x + Math.cos(angle) * dist,
    y: b.y + Math.sin(angle) * dist,
    color: def.canGather ? palette.accent : palette.primary,
    speciesId: def.speciesId,
  });
  // March newly trained units to the building rally point.
  const dx = b.rallyX - u.x;
  const dy = b.rallyY - u.y;
  if (dx * dx + dy * dy > 36) {
    u.attackTargetId = null;
    u.gatherNodeId = null;
    u.attackMove = false;
    setUnitPath(world, u, { x: b.rallyX, y: b.rallyY });
  }
}

/** Hotkeys for selected player building. */
export function trainHotkey(
  world: BattlefieldWorld,
  building: BattlefieldBuilding | null,
  slot: number,
): boolean {
  if (!building || building.team !== 'player' || !building.complete) return false;
  const trains = getBuildingType(building.typeId).trains;
  const typeId = trains[slot];
  if (!typeId) return false;
  return queueTrain(world, building, typeId);
}
