/**
 * Minimap gold-stock tip (presentation only).
 * Live player gold — pairs with Crystal tip; distinct from pause Gold · Crystal combo.
 */
import { t } from '../../i18n';

/** Gold · {n} — live gold wallet on the minimap chrome. */
export function minimapGoldStockTipText(gold: number): string {
  const n = Math.max(0, Math.floor(gold));
  return t('hud.minimapGold', { n });
}
