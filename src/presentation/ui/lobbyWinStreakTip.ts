/**
 * Lobby tip for current consecutive wins from match prefs.
 * Format: Streak · {n} — middot (U+00B7).
 * Same en/pt-BR/es copy as pause/end Streak · tips; distinct i18n key /
 * surface. Distinct from Loss streak · / Record · / Wins · /
 * Best streak · peers.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive win streak yet. */
export function lobbyWinStreakTipLine(): string | null {
  const n = loadMatchPrefs().winStreak;
  if (n == null || n <= 0) return null;
  return t('lobby.winStreakTip', { n: Math.floor(n) });
}
