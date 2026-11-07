/**
 * Minimap selected-count tip (presentation only).
 * Format: Selected · {n} — middot (U+00B7).
 * Live selection size — same en/pt-BR/es copy as pause Selected · n tip
 * (`pause.selectionCountTip` / `pauseSelectionCountTipLine`), distinct
 * key/surface (`hud.minimapSelected`). Distinct from Army · / Pop · /
 * Enemies · / Buildings · chrome chips.
 */
import { t } from '../../i18n';

/** Selected · {n} — living player units currently selected. */
export function minimapSelectedCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapSelected', { n });
}
