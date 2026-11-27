/**
 * Lobby tip for the last-played / remembered difficulty from match prefs.
 * Last difficulty · {label} (U+00B7). Distinct from selected difficulty
 * label · blurb (`lobby.difficultyTip` / pause twin), end Difficulty ·, and
 * Last · faction same-prefix peer.
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, t } from '../../i18n';

export function lobbyLastDifficultyTipLine(): string {
  const d = difficultyCopy(loadMatchPrefs().difficulty);
  return t('lobby.lastDifficultyTip', { label: d.label });
}
