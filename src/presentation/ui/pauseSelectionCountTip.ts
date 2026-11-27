/**
 * Pause overlay selection-count tip (HUD label only).
 * Format: Selected · {n} — middot (U+00B7).
 * Frozen when pause opens — same en/pt-BR/es copy as minimap Selected · n
 * tip (`hud.minimapSelected` / `minimapSelectedCountTipText`), distinct
 * key/surface (`pause.selectionCountTip`). Distinct from Army · / Pop · /
 * Buildings · pause chips and selection-panel flavor copy.
 */
import { t } from '../../i18n';

/** Selected · {n} — living player units selected at pause. */
export function pauseSelectionCountTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.selectionCountTip', { n });
}
