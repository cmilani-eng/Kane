/**
 * End-screen units-trained tip (HUD label only).
 * Tallied from player production completions — not starting roster.
 */
import { t } from '../../i18n';

export function endUnitsTrainedTipLine(trained: number): string {
  return t('end.trainedTip', { n: Math.max(0, Math.floor(trained)) });
}
