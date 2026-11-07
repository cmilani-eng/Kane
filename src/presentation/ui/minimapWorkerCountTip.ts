/**
 * Minimap living-worker count tip (presentation only).
 * All living player gatherers — distinct from Idle · n tip.
 */
import { t } from '../../i18n';

/** Workers · {n} — live gatherer count on the minimap chrome. */
export function minimapWorkerCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapWorkers', { n });
}
