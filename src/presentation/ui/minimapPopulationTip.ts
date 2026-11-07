/**
 * Minimap population tip (presentation only).
 * Format: Pop · {n} — middot (U+00B7).
 * Living player unit count — distinct from Supply · used/cap /
 * Army · / Selected · minimap peers; same en/pt-BR/es copy as pause
 * Pop tip (`pause.populationTip` / `pausePopulationTipLine`), own key.
 */
import { t } from '../../i18n';

/** Pop · {n} — live living-player count on the minimap chrome. */
export function minimapPopulationTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapPop', { n });
}
