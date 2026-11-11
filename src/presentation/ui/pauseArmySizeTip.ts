/**
 * Pause overlay army-size tip (HUD label only).
 * Format: Army · {n} — middot (U+00B7).
 * Living player combat units at pause — same isMilitaryUnit filter as minimap;
 * same en/pt-BR/es copy as minimap Army · tip (`hud.minimapArmy` /
 * `minimapArmyCountTipText`), distinct key/surface (`pause.armyTip`).
 * Distinct from Pop · / Selected · / Buildings · pause chips.
 */
import { t } from '../../i18n';

/** Army · {n} — frozen pause snapshot of living player military. */
export function pauseArmySizeTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.armyTip', { n });
}
