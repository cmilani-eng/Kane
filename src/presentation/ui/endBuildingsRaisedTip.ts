/**
 * End-screen buildings-raised tip (HUD label only).
 * Format: Raised · {n} — middot (U+00B7).
 * Tallied from player construction completions — not starting halls.
 * Distinct from Trained · / Lost · / Kills · / Razed · / Gathered · peers;
 * end-only construction tip (no lobby/pause twin).
 */
import { t } from '../../i18n';

export function endBuildingsRaisedTipLine(raised: number): string {
  return t('end.raisedTip', { n: Math.max(0, Math.floor(raised)) });
}
