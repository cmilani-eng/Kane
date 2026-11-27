/**
 * Pause overlay supply tip (HUD label only).
 * Format: Supply · used/cap — middot (U+00B7).
 * Living pop vs unitCap frozen at pause open — distinct from Pop · /
 * Army · / Selected · pause peers and stock/HUD formatSupplyLine
 * (spaced slash); same en/pt-BR/es copy as minimap Supply tip
 * (`hud.minimapSupply` / `minimapSupplyTipText`), own key.
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
