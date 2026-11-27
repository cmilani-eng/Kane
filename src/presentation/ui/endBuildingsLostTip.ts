/**
 * End-screen buildings-lost tip (HUD label only).
 * Format: Razed · {n} — middot (U+00B7).
 * Tallied from player building destructions.
 * Distinct from Lost · / Kills · / Raised · / Efficiency · / kill-ratio peers;
 * end-only combat tip (no lobby/pause twin).
 */
import { t } from '../../i18n';

export function endBuildingsLostTipLine(lost: number): string {
  return t('end.bldLostTip', { n: Math.max(0, Math.floor(lost)) });
}
