/**
 * Pause overlay selection-count tip (HUD label only).
 * Frozen when pause opens — distinct from selection-panel flavor copy.
 */
import { t } from '../../i18n';

/** Selected · {n} — living player units selected at pause. */
export function pauseSelectionCountTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.selectionCountTip', { n });
}
