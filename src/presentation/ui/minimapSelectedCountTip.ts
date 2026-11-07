/**
 * Minimap selected-count tip (presentation only).
 * Format: Selected · {n} — middot (U+00B7).
 * Live selection size — distinct surface from pause Selected · n tip
 * (`pause.selectionCountTip` / `pauseSelectionCountTipLine`).
 */
import { t } from '../../i18n';

/** Selected · {n} — living player units currently selected. */
export function minimapSelectedCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapSelected', { n });
}
