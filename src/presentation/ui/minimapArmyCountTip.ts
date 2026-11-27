/**
 * Minimap army size tip (presentation only).
 * Format: Army · {n} — middot (U+00B7).
 * Living player combat units — distinct surface from pause Army · tip
 * (`pause.armyTip` / `pauseArmySizeTipLine`), HUD Army button, idle army
 * chip, and Selected · / Vision · / Fog · minimap peers.
 */
import { t } from '../../i18n';

/** Army · {n} — live combat-unit count on the minimap chrome. */
export function minimapArmyCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapArmy', { n });
}
