/**
 * Minimap building count tip (presentation only).
 * Format: Buildings · {n} — middot (U+00B7).
 * Living player buildings — distinct surface from pause Buildings · tip
 * (`pause.buildingsTip` / `pauseBuildingCountTipLine`), and from
 * Army · / Enemies · / Selected · minimap peers.
 */
import { t } from '../../i18n';

/** Buildings · {n} — live player building count on the minimap chrome. */
export function minimapBuildingCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapBuildings', { n });
}
