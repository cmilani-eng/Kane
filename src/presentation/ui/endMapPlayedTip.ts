/**
 * End-screen map played tip (HUD label only).
 * Format: Map · {name} from match mapId — distinct from Map · w×h size tip
 * and from the meta map · difficulty · clock line.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { mapCopy, t } from '../../i18n';

export function endMapPlayedTipLine(mapId: SkirmishMapId): string {
  return t('end.mapTip', { name: mapCopy(mapId).label });
}
