/**
 * Minimap living-worker count tip (presentation only).
 * Format: Workers · {n} — middot (U+00B7) with single spaces.
 * Living player gatherers — distinct from Idle · / Army · / Pop ·
 * minimap peers and HUD idle chip; en/pt-BR/es middot via
 * `hud.minimapWorkers`.
 */
import { t } from '../../i18n';

/** Workers · {n} — live gatherer count on the minimap chrome. */
export function minimapWorkerCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapWorkers', { n });
}
