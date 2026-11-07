/**
 * Pause overlay building-count tip (HUD label only).
 * Format: Buildings · {n} — middot (U+00B7).
 * Living player buildings at pause — same filter as minimap buildings tip;
 * distinct surface from minimap Buildings · tip (`hud.minimapBuildings` /
 * `minimapBuildingCountTipText`), and from Army · / Pop peers.
 */
import { t } from '../../i18n';

/** Buildings · {n} — frozen pause snapshot of living player buildings. */
export function pauseBuildingCountTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.buildingsTip', { n });
}
