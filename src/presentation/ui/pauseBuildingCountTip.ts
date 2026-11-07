/**
 * Pause overlay building-count tip (HUD label only).
 * Living player buildings at pause — same filter as minimap buildings tip.
 */
import { t } from '../../i18n';

/** Buildings · {n} — frozen pause snapshot of living player buildings. */
export function pauseBuildingCountTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.buildingsTip', { n });
}
