/**
 * End-screen map world-size tip (HUD label only).
 * Format: Map · {w}×{h} — middot (U+00B7) from match mapId + MAP catalog.
 * Same en copy as lobby Map · w×h tip, distinct key/surface
 * (`end.mapSizeTip` vs `lobby.lastMapSizeTip`). Distinct from Map · name /
 * Best map · / Last map · / selection Size · w×h footprint.
 */
import { MAP } from '../../config/balance';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { t } from '../../i18n';

/** Map · {w}×{h} — battlefield bounds for the match map (middot U+00B7). */
export function endMapSizeTipLine(_mapId: SkirmishMapId): string {
  // All skirmish layouts share the battlefield MAP bounds.
  return t('end.mapSizeTip', { w: MAP.width, h: MAP.height });
}
