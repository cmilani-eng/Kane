/**
 * Pause overlay current-map tip (HUD label only).
 * Format: Map · {name} (middot U+00B7) from match mapId.
 * Same en copy as end Map · name tip, distinct key/surface
 * (`pause.map` vs `end.mapTip`). Distinct from Best map · /
 * Map · w×h / Last map · / Focus · / species motto.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { mapCopy, t } from '../../i18n';

export function pauseMapTipLine(mapId: SkirmishMapId): string {
  return t('pause.map', { name: mapCopy(mapId).label });
}
