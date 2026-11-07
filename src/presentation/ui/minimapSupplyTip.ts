/**
 * Minimap supply usage tip (presentation only).
 * Format: Supply · used/cap — middot (U+00B7).
 * Living player population vs unitCap — distinct from Pop · /
 * Army · / Selected · minimap peers and stock/HUD formatSupplyLine
 * (spaced slash); same en/pt-BR/es copy as pause Supply tip
 * (`pause.supplyRatioTip` / `pauseSupplyRatioTipLine`), own key.
 */
import { t } from '../../i18n';

/** Supply · used/cap — live player population on the minimap chrome. */
export function minimapSupplyTipText(current: number, cap: number): string {
  const used = Math.max(0, Math.floor(current));
  const k = Math.max(0, Math.floor(cap));
  return t('hud.minimapSupply', { used, cap: k });
}
