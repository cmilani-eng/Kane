/**
 * End-screen resources-gathered tip (HUD label only).
 * Total Keep deposits this match — gold + crystals combined.
 * Distinct from the gold/crystal breakdown line (`end.gathered`).
 */
import { t } from '../../i18n';

export function endResourcesGatheredTipLine(
  gold: number,
  crystals: number,
): string {
  const n = Math.max(0, Math.floor(gold)) + Math.max(0, Math.floor(crystals));
  return t('end.gatheredTip', { n });
}
