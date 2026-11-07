/**
 * Pause overlay population tip (HUD label only).
 * Living player unit count at pause — distinct from Supply · used/cap tip.
 */
import { t } from '../../i18n';

/** Pop · {n} — frozen pause snapshot of living player population. */
export function pausePopulationTipLine(current: number): string {
  const n = Math.max(0, Math.floor(current));
  return t('pause.populationTip', { n });
}
