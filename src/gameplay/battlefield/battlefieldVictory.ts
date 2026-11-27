/**
 * Victory / defeat — keep destroyed, army wiped, or CORE hold win.
 */
import { CORE_FRAGMENT } from './battlefieldCoreFragments';
import { keepAlive, livingByTeam } from './battlefieldCombat';
import type { BattlefieldWorld } from './battlefieldWorld';

export type MatchResult = 'ongoing' | 'victory' | 'defeat';

/** The result as seen from `team`: the simulation reports it from the player side. */
export function resultForTeam(result: MatchResult, team: 'player' | 'enemy'): MatchResult {
  if (team === 'player' || result === 'ongoing') return result;
  return result === 'victory' ? 'defeat' : 'victory';
}

export type MatchEndReason = 'keep' | 'wipe' | 'core_hold' | null;

export function evaluateMatch(world: BattlefieldWorld): MatchResult {
  const playerKeep = keepAlive(world, 'player');
  const enemyKeep = keepAlive(world, 'enemy');
  const playerUnits = livingByTeam(world, 'player');
  const enemyUnits = livingByTeam(world, 'enemy');

  if (!playerKeep) return 'defeat';
  if (!enemyKeep) return 'victory';

  // Wipe: no units and no production buildings left to rebuild army
  const playerProd = world.buildings.some(
    (b) => b.team === 'player' && b.complete && b.hp > 0,
  );
  const enemyProd = world.buildings.some(
    (b) => b.team === 'enemy' && b.complete && b.hp > 0,
  );
  if (playerUnits === 0 && !playerProd) return 'defeat';
  if (enemyUnits === 0 && !enemyProd) return 'victory';

  const winMs = CORE_FRAGMENT.holdWinMs;
  if ((world.playerCoreHoldMs ?? 0) >= winMs) return 'victory';
  if ((world.enemyCoreHoldMs ?? 0) >= winMs) return 'defeat';

  return 'ongoing';
}

/** Why the match ended (for end-screen copy). */
export function matchEndReason(
  world: BattlefieldWorld,
  result: Exclude<MatchResult, 'ongoing'>,
): MatchEndReason {
  const winMs = CORE_FRAGMENT.holdWinMs;
  if (result === 'victory' && (world.playerCoreHoldMs ?? 0) >= winMs) {
    return 'core_hold';
  }
  if (result === 'defeat' && (world.enemyCoreHoldMs ?? 0) >= winMs) {
    return 'core_hold';
  }
  if (result === 'victory' && !keepAlive(world, 'enemy')) return 'keep';
  if (result === 'defeat' && !keepAlive(world, 'player')) return 'keep';
  return 'wipe';
}
