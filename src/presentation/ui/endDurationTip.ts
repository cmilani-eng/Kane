/**
 * End-screen match duration tip (HUD label only).
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

export function endDurationTipLine(durationMs: number): string {
  return t('end.durationTip', { clock: formatMatchClock(durationMs) });
}
