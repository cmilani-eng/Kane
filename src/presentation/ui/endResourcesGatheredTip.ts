/**
 * End-screen resources-gathered tip (HUD label only).
 * Format: Gathered · {n} — middot (U+00B7).
 * Total Keep deposits this match — gold + crystals combined.
 * Distinct from Trained · / Raised · / Lost · / Kills · / Razed · peers
 * and from the gold/crystal breakdown line (`end.gathered`); end-only
 * economy tip (no lobby/pause twin).
 */
import { t } from '../../i18n';

export function endResourcesGatheredTipLine(
  gold: number,
  crystals: number,
): string {
  const n = Math.max(0, Math.floor(gold)) + Math.max(0, Math.floor(crystals));
  return t('end.gatheredTip', { n });
}
