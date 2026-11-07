import { SKIRMISH_MAP_ORDER, type SkirmishMapId } from '../../data/skirmishMaps';
import type { AiDifficultyId } from './aiDifficulty';

/**
 * A Hard win offers the next map at Hard. Lower difficulties still step up
 * the ladder, and a loss stays on the map just played.
 */
export function nextMapAfterHardWin(
  win: boolean,
  difficulty: AiDifficultyId,
  mapId: SkirmishMapId,
): SkirmishMapId | null {
  if (!win || difficulty !== 'hard') return null;
  const index = SKIRMISH_MAP_ORDER.indexOf(mapId);
  if (index < 0) return null;
  return SKIRMISH_MAP_ORDER[(index + 1) % SKIRMISH_MAP_ORDER.length] ?? null;
}
