/**
 * Pause overlay idle-workers tip (HUD label only).
 * Same countIdleWorkers filter as minimap Idle tip — frozen at pause open.
 */
import { t } from '../../i18n';

/** Idle · {n} — frozen pause snapshot of idle player gatherers. */
export function pauseIdleWorkersTipLine(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('pause.idleTip', { n });
}
