/**
 * Minimap supply usage tip (presentation only).
 * Distinct from pause Supply · used/cap tip and HUD spaced-slash line.
 */
import { t } from '../../i18n';

/** Supply · used/cap — live player population on the minimap chrome. */
export function minimapSupplyTipText(current: number, cap: number): string {
  const used = Math.max(0, Math.floor(current));
  const k = Math.max(0, Math.floor(cap));
  return t('hud.minimapSupply', { used, cap: k });
}
