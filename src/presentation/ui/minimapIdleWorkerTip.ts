/**
 * Minimap idle-worker count tip (presentation only).
 * Distinct from the HUD idle chip / gather-type tip.
 */
import { t } from '../../i18n';

/** Idle · {n} — live idle gatherer count on the minimap chrome. */
export function minimapIdleWorkerTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapIdle', { n });
}
