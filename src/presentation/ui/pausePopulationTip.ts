/**
 * Pause overlay population tip (HUD label only).
 * Format: Pop · {n} — middot (U+00B7).
 * Living player unit count at pause — distinct from Supply · used/cap /
 * Army · / Selected · pause peers; same en/pt-BR/es copy as minimap
 * Pop tip (`hud.minimapPop` / `minimapPopulationTipText`), own key.
 */
import { t } from '../../i18n';

/** Pop · {n} — frozen pause snapshot of living player population. */
export function pausePopulationTipLine(current: number): string {
  const n = Math.max(0, Math.floor(current));
  return t('pause.populationTip', { n });
}
