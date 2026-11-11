/**
 * End-screen efficiency tip (HUD label only).
 * Format: Efficiency · {pct}% — middot (U+00B7).
 * Combat efficiency % = kills / (kills + losses).
 * Distinct from Kills · / Lost · / Win rate · / kill-ratio peers;
 * end-only combat tip (no lobby/pause twin).
 */
import { t } from '../../i18n';

/** Whole-percent combat efficiency; null when no kills or losses yet. */
export function matchEfficiencyPct(
  kills: number,
  losses: number,
): number | null {
  const k = Math.max(0, Math.floor(kills));
  const l = Math.max(0, Math.floor(losses));
  const total = k + l;
  if (total <= 0) return null;
  return Math.round((100 * k) / total);
}

export function endEfficiencyTipLine(
  kills: number,
  losses: number,
): string | null {
  const pct = matchEfficiencyPct(kills, losses);
  if (pct == null) return null;
  return t('end.efficiencyTip', { pct });
}
