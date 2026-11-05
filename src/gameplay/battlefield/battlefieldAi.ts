/**
 * Simple skirmish AI — gather, build, train, attack (species-aware).
 */
import { placeableBuildings } from '../../data/buildings';
import { buildingBlocks, placeBuilding } from './battlefieldBuildings';
import { walletOf } from './battlefieldEconomy';
import { queueTrain } from './battlefieldProduction';
import type { BattlefieldWorld } from './battlefieldWorld';
import { dist } from '../math';
import { getBuildingType } from '../../data/buildings';

export interface AiState {
  thinkCd: number;
  phase: 'eco' | 'army' | 'attack';
}

export function createAiState(): AiState {
  return { thinkCd: 800, phase: 'eco' };
}

export function tickBattlefieldAi(
  world: BattlefieldWorld,
  ai: AiState,
  dtMs: number,
): void {
  ai.thinkCd -= dtMs;
  if (ai.thinkCd > 0) return;
  ai.thinkCd = 900;

  const species = world.enemySpeciesId;
  const wallet = walletOf(world, 'enemy');
  const keep = world.buildings.find(
    (b) =>
      b.team === 'enemy' &&
      getBuildingType(b.typeId).isMainHall &&
      b.complete,
  );
  const prodBuildings = world.buildings.filter(
    (b) =>
      b.team === 'enemy' &&
      b.complete &&
      !getBuildingType(b.typeId).isMainHall &&
      getBuildingType(b.typeId).trains.length > 0,
  );
  const scavengers = world.units.filter(
    (u) => u.team === 'enemy' && u.canGather,
  );
  const army = world.units.filter((u) => u.team === 'enemy' && !u.canGather);

  for (const s of scavengers) {
    if (s.gatherNodeId != null || s.carrying > 0 || s.attackTargetId != null)
      continue;
    let best = null as (typeof world.nodes)[0] | null;
    let bestD = Infinity;
    for (const n of world.nodes) {
      if (n.remaining <= 0) continue;
      const d = dist(s.x, s.y, n.x, n.y);
      if (d < bestD) {
        best = n;
        bestD = d;
      }
    }
    if (best) {
      s.gatherNodeId = best.id;
      s.moveTarget = { x: best.x, y: best.y };
    }
  }

  // Build first placeable production building
  const placeables = placeableBuildings(species).filter((id) => {
    const d = getBuildingType(id);
    return d.trains.length > 0;
  });
  const needType = placeables[0];
  if (
    needType &&
    keep &&
    !prodBuildings.some((b) => b.typeId === needType) &&
    wallet.gold >= (getBuildingType(needType).cost.gold ?? 100)
  ) {
    const spots = [
      { x: keep.x + 120, y: keep.y },
      { x: keep.x - 120, y: keep.y },
      { x: keep.x, y: keep.y + 120 },
      { x: keep.x + 90, y: keep.y + 90 },
    ];
    const radius = getBuildingType(needType).radius;
    for (const p of spots) {
      if (buildingBlocks(world, p.x, p.y, radius)) continue;
      if (placeBuilding(world, 'enemy', needType, p.x, p.y)) break;
    }
  }

  if (keep && scavengers.length < 4) {
    const worker = getBuildingType(keep.typeId).trains[0];
    if (worker) queueTrain(world, keep, worker);
  }
  for (const b of prodBuildings) {
    if (army.length >= 10) break;
    const trains = getBuildingType(b.typeId).trains;
    const pick = trains[0];
    if (pick) queueTrain(world, b, pick);
  }

  if (army.length >= 5) ai.phase = 'attack';
  else if (army.length >= 3) ai.phase = 'army';
  else ai.phase = 'eco';

  if (ai.phase === 'attack') {
    const targetKeep = world.buildings.find(
      (b) => b.team === 'player' && getBuildingType(b.typeId).isMainHall,
    );
    const targetUnit = world.units.find((u) => u.team === 'player');
    const target = targetKeep ?? targetUnit;
    if (!target) return;
    for (const u of army) {
      if (u.attackTargetId != null) continue;
      u.gatherNodeId = null;
      u.attackTargetId = target.id;
      u.moveTarget = { x: target.x, y: target.y };
    }
  } else if (keep) {
    for (const u of army) {
      if (u.attackTargetId != null) continue;
      if (dist(u.x, u.y, keep.x, keep.y) > 160) {
        u.moveTarget = {
          x: keep.x + (Math.random() - 0.5) * 80,
          y: keep.y + (Math.random() - 0.5) * 80,
        };
      }
    }
  }
}
