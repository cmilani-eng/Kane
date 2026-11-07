/**
 * Lobby tip for current consecutive losses from match prefs.
 * Format: Loss streak · {n} — middot (U+00B7).
 * Same en/pt-BR/es copy as pause/end Loss streak · tips; distinct i18n key /
 * surface. Distinct from Streak · / Best streak · / Losses · peers.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive loss streak yet. */
export function lobbyLossStreakTipLine(): string | null {
  const n = loadMatchPrefs().lossStreak;
  if (n == null || n <= 0) return null;
  return t('lobby.lossStreakTip', { n: Math.floor(n) });
}
