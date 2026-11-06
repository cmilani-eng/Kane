/**
 * Player base / keep location for camera home.
 */
import { getBuildingType } from '../../data/buildings';
import type { BattlefieldWorld } from './battlefieldWorld';

/** World point of the player's main hall (fallback: stockpile / first building). */
export function findPlayerBasePoint(
  world: BattlefieldWorld,
): { x: number; y: number } | null {
  const hall = world.buildings.find(
    (b) =>
      b.team === 'player' &&
      b.hp > 0 &&
      getBuildingType(b.typeId).isMainHall,
  );
  if (hall) return { x: hall.x, y: hall.y };

  const pile = world.stockpiles.find((s) => s.team === 'player');
  if (pile) return { x: pile.x, y: pile.y };

  const any = world.buildings.find((b) => b.team === 'player' && b.hp > 0);
  if (any) return { x: any.x, y: any.y };

  const u = world.units.find((o) => o.team === 'player' && o.hp > 0);
  if (u) return { x: u.x, y: u.y };

  return null;
}
