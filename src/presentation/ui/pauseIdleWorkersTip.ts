/**
 * Pause overlay idle-workers tip (HUD label only).
 * Format: Idle · {n} — middot (U+00B7).
 * Idle gatherer count frozen at pause open — distinct from Army · /
 * Pop · / Selected · pause peers; same en/pt-BR/es copy as minimap
 * Idle tip (`hud.minimapIdle` / `minimapIdleWorkerTipText`), own key.
 * Same countIdleWorkers filter as minimap Idle tip.
 */
import { t } from '../../i18n';

/** Idle · {n} — frozen pause snapshot of idle player gatherers. */
export function pauseIdleWorkersTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.idleTip', { n });
}
