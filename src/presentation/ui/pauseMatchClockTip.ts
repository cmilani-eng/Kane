/**
 * Pause overlay match-clock tip (HUD label only).
 * Frozen when pause opens — distinct from the Elapsed line / end Duration tip.
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Time · mm:ss — match elapsed at pause. */
export function pauseMatchClockTipLine(elapsedMs: number): string {
  return t('pause.clockTip', {
    clock: formatMatchClock(Math.max(0, elapsedMs)),
  });
}
