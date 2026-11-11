/**
 * Minimap idle-worker count tip (presentation only).
 * Format: Idle · {n} — middot (U+00B7).
 * Idle gatherer count — distinct from Workers · / Army · / Pop ·
 * minimap peers and HUD idle chip; same en/pt-BR/es copy as pause
 * Idle tip (`pause.idleTip` / `pauseIdleWorkersTipLine`), own key.
 */
import { t } from '../../i18n';

/** Idle · {n} — live idle gatherer count on the minimap chrome. */
export function minimapIdleWorkerTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapIdle', { n });
}
