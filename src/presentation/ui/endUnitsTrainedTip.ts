/**
 * End-screen units-trained tip (HUD label only).
 * Format: Trained · {n} — middot (U+00B7).
 * Tallied from player production completions — not starting roster.
 * Distinct from Raised · / Lost · / Kills · / Razed · / Gathered · peers;
 * end-only production tip (no lobby/pause twin).
 */
import { t } from '../../i18n';

export function endUnitsTrainedTipLine(trained: number): string {
  return t('end.trainedTip', { n: Math.max(0, Math.floor(trained)) });
}
