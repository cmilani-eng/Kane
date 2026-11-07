/**
 * Minimap army count tip (presentation only).
 * Living player combat units — distinct from HUD Army button / idle army chip.
 */
import { t } from '../../i18n';

/** Army · {n} — live combat-unit count on the minimap chrome. */
export function minimapArmyCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapArmy', { n });
}
