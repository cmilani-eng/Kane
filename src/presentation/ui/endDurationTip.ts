/**
 * End-screen match duration tip (HUD label only).
 * Format: Time · mm:ss — same clock helper as pause/end meta; distinct from APM.
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

export function endDurationTipLine(durationMs: number): string {
  return t('end.durationTip', {
    clock: formatMatchClock(Math.max(0, durationMs)),
  });
}
