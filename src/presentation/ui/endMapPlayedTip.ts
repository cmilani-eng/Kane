/**
 * End-screen map played tip (HUD label only).
 * Format: Map · {name} — middot (U+00B7) from match mapId.
 * Same en copy as pause Map · name tip, distinct key/surface
 * (`end.mapTip` vs `pause.map`). Distinct from Map · w×h size tip /
 * Best map · / Last map · / meta map · difficulty · clock / Difficulty ·.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { mapCopy, t } from '../../i18n';

export function endMapPlayedTipLine(mapId: SkirmishMapId): string {
  return t('end.mapTip', { name: mapCopy(mapId).label });
}
