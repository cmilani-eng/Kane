/**
 * End-screen buildings-lost tip (HUD label only).
 * Tallied from player building destructions — distinct from units Lost tip.
 */
import { t } from '../../i18n';

export function endBuildingsLostTipLine(lost: number): string {
  return t('end.bldLostTip', { n: Math.max(0, Math.floor(lost)) });
}
