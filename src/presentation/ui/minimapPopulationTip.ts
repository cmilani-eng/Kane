/**
 * Minimap population tip (presentation only).
 * Living player unit count — distinct from Supply · used/cap tip.
 */
import { t } from '../../i18n';

/** Pop · {n} — live living-player count on the minimap chrome. */
export function minimapPopulationTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapPop', { n });
}
