/**
 * End-screen match duration tip (HUD label only).
 * Format: Time · mm:ss — middot (U+00B7).
 * Distinct from APM · / Avg time · / Vision · peers;
 * same en/pt-BR/es copy as pause/minimap Time · tips (`pause.clockTip` /
 * `hud.minimapClock`), own key (`end.durationTip`).
 */
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Time · mm:ss — match elapsed at end. */
export function endDurationTipLine(durationMs: number): string {
  return t('end.durationTip', {
    clock: formatMatchClock(Math.max(0, durationMs)),
  });
}
