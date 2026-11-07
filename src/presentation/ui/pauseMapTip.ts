/**
 * Pause overlay current-map tip (HUD label only).
 * Format: Map · {name} — distinct surface from end Map · name tip.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { mapCopy, t } from '../../i18n';

export function pauseMapTipLine(mapId: SkirmishMapId): string {
  return t('pause.map', { name: mapCopy(mapId).label });
}
