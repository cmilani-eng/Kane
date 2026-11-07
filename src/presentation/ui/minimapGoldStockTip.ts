/**
 * Minimap gold-stock tip (presentation only).
 * Format: Gold · {n} — middot (U+00B7).
 * Live player gold — distinct from Crystal · / Selected · minimap
 * peers and pause Gold · Crystal combo tip.
 */
import { t } from '../../i18n';

/** Gold · {n} — live gold wallet on the minimap chrome. */
export function minimapGoldStockTipText(gold: number): string {
  const n = Math.max(0, Math.floor(gold));
  return t('hud.minimapGold', { n });
}
