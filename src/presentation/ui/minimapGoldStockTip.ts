/**
 * Minimap gold-stock tip (presentation only).
 * Format: Gold · {n} — middot (U+00B7) with single spaces.
 * Live player gold — distinct from Crystal · (`hud.minimapCrystal`) /
 * Selected · (`hud.minimapSelected`) minimap peers and pause
 * Gold · Crystal combo (`pause.stockTip`); en/pt-BR/es middot via
 * `hud.minimapGold`.
 */
import { t } from '../../i18n';

/** Gold · {n} — live gold wallet on the minimap chrome. */
export function minimapGoldStockTipText(gold: number): string {
  const n = Math.max(0, Math.floor(gold));
  return t('hud.minimapGold', { n });
}
