/**
 * Minimap match-clock tip (presentation only).
 * Format: Time · mm:ss — middot (U+00B7).
 * Live match elapsed on the minimap chrome.
 * Distinct from APM · / Avg time · / Vision · peers;
 * same en/pt-BR/es copy as pause/end Time · tips (`pause.clockTip` /
 * `end.durationTip`), own key (`hud.minimapClock`).
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Time · mm:ss — live match elapsed on the minimap chrome. */
export function minimapMatchClockTipText(elapsedMs: number): string {
  return t('hud.minimapClock', {
    clock: formatMatchClock(Math.max(0, elapsedMs)),
  });
}
