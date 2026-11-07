/**
 * End-screen map world-size tip (HUD label only).
 * Same MAP catalog bounds as lobby Map · w×h — distinct surface / i18n key
 * from lobby last-map-size and from end Map · name tip.
 */
import { MAP } from '../../config/balance';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { t } from '../../i18n';

/** Map · {w}×{h} — battlefield bounds for the match map. */
export function endMapSizeTipLine(_mapId: SkirmishMapId): string {
  // All skirmish layouts share the battlefield MAP bounds.
  return t('end.mapSizeTip', { w: MAP.width, h: MAP.height });
}
