/**
 * Pause overlay resource-stock tip (HUD label only).
 * Frozen when pause opens — distinct from stock strip / HUD gold-crystal lines.
 */
import { t } from '../../i18n';

/** Gold · {n} · Crystal · {m} — player wallet at pause. */
export function pauseStockTipLine(gold: number, crystals: number): string {
  const g = Math.max(0, Math.floor(gold));
  const c = Math.max(0, Math.floor(crystals));
  return t('pause.stockTip', { gold: g, crystals: c });
}
