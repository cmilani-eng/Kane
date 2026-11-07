/**
 * End-screen career win-rate tip (HUD label only).
 * Wins / finished games from match prefs — distinct surface from lobby Win rate tip
 * and from end Efficiency tip.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Whole percent 0–100. Null when no finished matches yet. */
export function endWinRatePercent(): number | null {
  const prefs = loadMatchPrefs();
  const played = prefs.gamesPlayed;
  if (played == null || played <= 0) return null;
  const won = Math.max(0, Math.floor(prefs.gamesWon ?? 0));
  const n = Math.max(0, Math.floor(played));
  return Math.min(100, Math.round((100 * won) / n));
}

/** Null when prefs have no finished games counted yet. */
export function endWinRateTipLine(): string | null {
  const pct = endWinRatePercent();
  if (pct == null) return null;
  return t('end.winRateTip', { n: pct });
}
