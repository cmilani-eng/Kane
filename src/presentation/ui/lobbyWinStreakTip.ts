/**
 * Lobby tip for current consecutive wins from match prefs.
 * Format: Streak · {n} — middot (U+00B7) with single spaces; en/pt-BR/es middot.
 * Distinct from Best streak · / Loss streak · / Record · / Wins · peers
 * and from pause/end Streak · tips (same en copy; distinct i18n key / surface).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive win streak yet. */
export function lobbyWinStreakTipLine(): string | null {
  const n = loadMatchPrefs().winStreak;
  if (n == null || n <= 0) return null;
  return t('lobby.winStreakTip', { n: Math.floor(n) });
}
