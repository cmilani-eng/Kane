/**
 * Minimap crystal-stock tip (presentation only).
 * Format: Crystal · {n} — middot (U+00B7).
 * Live player magic crystals — distinct from Gold · / Selected · minimap
 * peers and pause Gold · Crystal combo tip.
 */
import { t } from '../../i18n';

/** Crystal · {n} — live crystal wallet on the minimap chrome. */
export function minimapCrystalStockTipText(crystals: number): string {
  const n = Math.max(0, Math.floor(crystals));
  return t('hud.minimapCrystal', { n });
}
