/**
 * Minimap match-clock tip (presentation only).
 * Live match elapsed — distinct surface from pause/end Time · tips.
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Time · mm:ss — live match elapsed on the minimap chrome. */
export function minimapMatchClockTipText(elapsedMs: number): string {
  return t('hud.minimapClock', {
    clock: formatMatchClock(Math.max(0, elapsedMs)),
  });
}
