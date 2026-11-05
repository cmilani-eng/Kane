/**
 * Simple skirmish AI — gather, build, train, attack (species-aware + difficulty).
 */
import { placeableBuildings } from '../../data/buildings';
import { buildingBlocks, placeBuilding } from './battlefieldBuildings';
import { walletOf } from './battlefieldEconomy';
import { queueTrain } from './battlefieldProduction';
import type { BattlefieldWorld } from './battlefieldWorld';
import { dist } from '../math';
import { getBuildingType } from '../../data/buildings';
import {
  getAiDifficulty,
  type AiDifficultyId,
  type AiDifficultyProfile,
} from './aiDifficulty';
import { setUnitPath } from './battlefieldPathfinding';

export interface AiState {
  thinkCd: number;
  phase: 'eco' | 'army' | 'attack';
  difficulty: AiDifficultyId;
  profile: AiDifficultyProfile;
}

export function createAiState(difficulty: AiDifficultyId = 'normal'): AiState {
  const profile = getAiDifficulty(difficulty);
  return {
    thinkCd: profile.thinkMs * 0.9,
    phase: 'eco',
    difficulty: profile.id,
    profile,
  };
}

export function tickBattlefieldAi(
  world: BattlefieldWorld,
  ai: AiState,
  dtMs: number,
): void {
  const p = ai.profile;
  ai.thinkCd -= dtMs;
  if (ai.thinkCd > 0) return;
  ai.thinkCd = p.thinkMs;

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
      setUnitPath(world, s, { x: best.x, y: best.y });
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
    for (const spot of spots) {
      if (buildingBlocks(world, spot.x, spot.y, radius)) continue;
      if (placeBuilding(world, 'enemy', needType, spot.x, spot.y)) break;
    }
  }

  if (keep && scavengers.length < p.workerTarget) {
    const worker = getBuildingType(keep.typeId).trains[0];
    if (worker) queueTrain(world, keep, worker);
  }
  for (const b of prodBuildings) {
    if (army.length >= p.armyCap) break;
    const trains = getBuildingType(b.typeId).trains;
    const pick = trains[0];
    if (pick) queueTrain(world, b, pick);
  }

  if (army.length >= p.attackArmyMin) ai.phase = 'attack';
  else if (army.length >= p.armyPhaseMin) ai.phase = 'army';
  else ai.phase = 'eco';

  const poke =
    ai.phase === 'army' &&
    p.pokeChance > 0 &&
    Math.random() < p.pokeChance;

  if (ai.phase === 'attack' || poke) {
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
      setUnitPath(world, u, { x: target.x, y: target.y });
    }
  } else if (keep) {
    for (const u of army) {
      if (u.attackTargetId != null) continue;
      if (dist(u.x, u.y, keep.x, keep.y) > 160) {
        setUnitPath(world, u, {
          x: keep.x + (Math.random() - 0.5) * 80,
          y: keep.y + (Math.random() - 0.5) * 80,
        });
      }
    }
  }
}
