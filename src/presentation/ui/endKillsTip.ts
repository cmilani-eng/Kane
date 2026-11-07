/**
 * End-screen kills tip (HUD label only).
 * Tallied from enemy unit removals — distinct from kill-ratio / Lost tips.
 */
import { t } from '../../i18n';

export function endKillsTipLine(kills: number): string {
  return t('end.killsTip', { n: Math.max(0, Math.floor(kills)) });
}
