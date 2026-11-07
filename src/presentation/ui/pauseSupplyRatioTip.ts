/**
 * Pause overlay supply ratio tip (HUD label only).
 * Distinct from stock/HUD `formatSupplyLine` (spaced slash).
 */
import { t } from '../../i18n';

/** Supply · used/cap — frozen pause snapshot of the population ratio. */
export function pauseSupplyRatioTipLine(
  current: number,
  cap: number,
): string {
  const used = Math.max(0, Math.floor(current));
  const k = Math.max(0, Math.floor(cap));
  return t('pause.supplyRatioTip', { used, cap: k });
}
