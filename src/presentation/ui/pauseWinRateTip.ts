/**
 * Pause overlay career win-rate tip (HUD label only).
 * Format: Win rate · {n}% — middot (U+00B7).
 * Frozen matchPrefs gamesWon / gamesPlayed at pause open. Same en/pt-BR/es
 * copy as lobby/end Win rate · tips; distinct i18n key / surface
 * (`pause.winRateTip` vs `lobby.winRateTip` / `end.winRateTip`). Distinct
 * from Played · / Record · / Streak · / Wins · / Efficiency · peers.
 */
import { t } from '../../i18n';

/** Whole percent 0–100. Null when no finished matches yet. */
export function pauseWinRatePercent(won: number, played: number): number | null {
  const n = Math.max(0, Math.floor(played));
  if (n <= 0) return null;
  const w = Math.max(0, Math.floor(won));
  return Math.min(100, Math.round((100 * w) / n));
}

/** Null when prefs have no finished games counted yet. */
export function pauseWinRateTipLine(won: number, played: number): string | null {
  const pct = pauseWinRatePercent(won, played);
  if (pct == null) return null;
  return t('pause.winRateTip', { n: pct });
}
