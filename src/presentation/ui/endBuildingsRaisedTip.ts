/**
 * End-screen buildings-raised tip (HUD label only).
 * Tallied from player construction completions — not starting halls.
 */
import { t } from '../../i18n';

export function endBuildingsRaisedTipLine(raised: number): string {
  return t('end.raisedTip', { n: Math.max(0, Math.floor(raised)) });
}
