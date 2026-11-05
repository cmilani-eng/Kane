/**
 * Victory / defeat — keep destroyed or army wiped.
 */
import { keepAlive, livingByTeam } from './battlefieldCombat';
import type { BattlefieldWorld } from './battlefieldWorld';

export type MatchResult = 'ongoing' | 'victory' | 'defeat';

export function evaluateMatch(world: BattlefieldWorld): MatchResult {
  const playerKeep = keepAlive(world, 'player');
  const enemyKeep = keepAlive(world, 'enemy');
  const playerUnits = livingByTeam(world, 'player');
  const enemyUnits = livingByTeam(world, 'enemy');

  if (!playerKeep || (playerUnits === 0 && !playerKeep)) {
    // keepAlive false means keep gone
  }
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

  return 'ongoing';
}
