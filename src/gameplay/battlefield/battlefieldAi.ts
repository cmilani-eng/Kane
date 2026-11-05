/**
 * Simple skirmish AI — gather, build, train, attack.
 * Not a full RTS brain; enough for SP match testing.
 */
import { MAP } from '../../config/balance';
import { buildingBlocks, placeBuilding } from './battlefieldBuildings';
import { walletOf } from './battlefieldEconomy';
import { queueTrain } from './battlefieldProduction';
import type { BattlefieldWorld } from './battlefieldWorld';
import { dist } from '../math';

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

  const wallet = walletOf(world, 'enemy');
  const keep = world.buildings.find(
    (b) => b.team === 'enemy' && b.typeId === 'rival_keep' && b.complete,
  );
  const barracks = world.buildings.find(
    (b) => b.team === 'enemy' && b.typeId === 'rival_barracks' && b.complete,
  );
  const scavengers = world.units.filter(
    (u) => u.team === 'enemy' && u.canGather,
  );
  const army = world.units.filter(
    (u) => u.team === 'enemy' && !u.canGather,
  );

  // 1) Idle scavengers → nearest gold/crystal node
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

  // 2) Build barracks when rich enough
  if (!barracks && keep && wallet.gold >= 100) {
    const spots = [
      { x: keep.x + 120, y: keep.y },
      { x: keep.x - 120, y: keep.y },
      { x: keep.x, y: keep.y + 120 },
      { x: keep.x + 90, y: keep.y + 90 },
    ];
    for (const p of spots) {
      if (buildingBlocks(world, p.x, p.y, 28)) continue;
      if (placeBuilding(world, 'enemy', 'rival_barracks', p.x, p.y)) break;
    }
  }

  // 3) Train scavengers from keep, grunts from barracks
  if (keep && scavengers.length < 4 && wallet.gold >= 40) {
    queueTrain(world, keep, 'rival_scavenger');
  }
  if (barracks && army.length < 10 && wallet.gold >= 55) {
    queueTrain(world, barracks, 'rival_grunt');
  }

  // 4) Attack when army is large enough
  if (army.length >= 5) ai.phase = 'attack';
  else if (army.length >= 3) ai.phase = 'army';
  else ai.phase = 'eco';

  if (ai.phase === 'attack') {
    const targetUnit = world.units.find((u) => u.team === 'player');
    const targetKeep = world.buildings.find(
      (b) => b.team === 'player' && b.typeId === 'junkyard',
    );
    const target = targetKeep ?? targetUnit;
    if (!target) return;
    for (const u of army) {
      if (u.attackTargetId != null) continue;
      u.gatherNodeId = null;
      u.attackTargetId = target.id;
      u.moveTarget = { x: target.x, y: target.y };
    }
  } else {
    // Hold near keep
    if (keep) {
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

  void MAP;
}
