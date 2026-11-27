/**
 * End-screen current win-streak tip (HUD label only).
 * Format: Streak · {n} — middot (U+00B7).
 * Career consecutive wins from match prefs after result write — same
 * en/pt-BR/es copy as pause/lobby Streak · tips; distinct i18n key /
 * surface. Distinct from Loss streak · / Win rate · / Best APM · /
 * Best streak · / Record · peers.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';

/** Null when prefs have no positive win streak (e.g. after a loss). */
export function endWinStreakTipLine(): string | null {
  const n = loadMatchPrefs().winStreak;
  if (n == null || n <= 0) return null;
  return t('end.winStreakTip', { n: Math.floor(n) });
}
