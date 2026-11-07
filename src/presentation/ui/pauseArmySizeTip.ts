/**
 * Pause overlay army-size tip (HUD label only).
 * Living player combat units at pause — same isMilitaryUnit filter as minimap.
 */
import { t } from '../../i18n';

/** Army · {n} — frozen pause snapshot of living player military. */
export function pauseArmySizeTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.armyTip', { n });
}
