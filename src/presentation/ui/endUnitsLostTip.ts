/**
 * End-screen units-lost tip (HUD label only).
 * Tallied from player unit removals — distinct from kill-ratio line.
 */
import { t } from '../../i18n';

export function endUnitsLostTipLine(losses: number): string {
  return t('end.lostTip', { n: Math.max(0, Math.floor(losses)) });
}
