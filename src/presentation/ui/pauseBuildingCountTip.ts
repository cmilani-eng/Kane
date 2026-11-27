/**
 * Pause overlay building-count tip (HUD label only).
 * Format: Buildings · {n} — middot (U+00B7).
 * Living player buildings at pause — same filter as minimap buildings tip;
 * same en/pt-BR/es copy as minimap Buildings · tip (`hud.minimapBuildings` /
 * `minimapBuildingCountTipText`), distinct key/surface (`pause.buildingsTip`).
 * Distinct from Army · / Pop · / Selected · pause chips.
 */
import { t } from '../../i18n';

/** Buildings · {n} — frozen pause snapshot of living player buildings. */
export function pauseBuildingCountTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.buildingsTip', { n });
}
