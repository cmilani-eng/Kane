/**
 * Minimap selected-count tip (presentation only).
 * Live selection size — distinct from pause Selected · n tip.
 */
import { t } from '../../i18n';

/** Selected · {n} — living player units currently selected. */
export function minimapSelectedCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapSelected', { n });
}
