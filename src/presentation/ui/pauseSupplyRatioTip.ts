/**
 * Pause overlay supply tip (HUD label only).
 * Format: Supply · used/cap — distinct from Pop · n, minimap Supply tip,
 * and stock/HUD formatSupplyLine (spaced slash).
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
