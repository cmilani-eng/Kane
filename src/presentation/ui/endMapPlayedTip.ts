/**
 * End-screen map played tip (HUD label only).
 * Distinct from the meta map · difficulty · clock line.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { mapCopy, t } from '../../i18n';

export function endMapPlayedTipLine(mapId: SkirmishMapId): string {
  return t('end.mapTip', { name: mapCopy(mapId).label });
}
