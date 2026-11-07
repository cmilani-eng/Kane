/**
 * Lobby tip for the last-played / remembered difficulty from match prefs.
 * Distinct from the selected difficulty blurb tip (`lobby.difficultyTip`).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, t } from '../../i18n';

export function lobbyLastDifficultyTipLine(): string {
  const d = difficultyCopy(loadMatchPrefs().difficulty);
  return t('lobby.lastDifficultyTip', { label: d.label });
}
