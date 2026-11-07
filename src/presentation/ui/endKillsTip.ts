/**
 * End-screen kills tip (HUD label only).
 * Format: Kills · {n} — middot (U+00B7).
 * Tallied from enemy unit removals.
 * Distinct from Lost · / Razed · / Efficiency · / kill-ratio peers;
 * end-only combat tip (no lobby/pause twin).
 */
import { t } from '../../i18n';

export function endKillsTipLine(kills: number): string {
  return t('end.killsTip', { n: Math.max(0, Math.floor(kills)) });
}
