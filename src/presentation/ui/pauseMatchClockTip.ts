/**
 * Pause overlay match-clock tip (HUD label only).
 * Format: Time · mm:ss — middot (U+00B7).
 * Frozen when pause opens — distinct from the Elapsed line.
 * Distinct from APM · / Avg time · / Vision · peers;
 * same en/pt-BR/es copy as minimap/end Time · tips (`hud.minimapClock` /
 * `end.durationTip`), own key (`pause.clockTip`).
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Time · mm:ss — match elapsed at pause. */
export function pauseMatchClockTipLine(elapsedMs: number): string {
  return t('pause.clockTip', {
    clock: formatMatchClock(Math.max(0, elapsedMs)),
  });
}
