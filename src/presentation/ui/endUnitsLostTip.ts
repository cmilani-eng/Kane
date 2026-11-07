/**
 * End-screen units-lost tip (HUD label only).
 * Format: Lost · {n} — middot (U+00B7).
 * Tallied from player unit removals.
 * Distinct from Kills · / Razed · / Efficiency · / Losses · / kill-ratio peers;
 * end-only combat tip (no lobby/pause twin).
 */
import { t } from '../../i18n';

export function endUnitsLostTipLine(losses: number): string {
  return t('end.lostTip', { n: Math.max(0, Math.floor(losses)) });
}
