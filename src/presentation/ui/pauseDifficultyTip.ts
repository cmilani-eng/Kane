/**
 * Pause overlay difficulty tip (HUD label only).
 * Format: {label} · {blurb} — middot (U+00B7) between difficulty
 * label and blurb (blurb may itself contain middots). Same en copy as
 * lobby selected difficulty tip, distinct key/surface
 * (`pause.difficultyTip` vs `lobby.difficultyTip`). Distinct from
 * Last difficulty · / end Difficulty · (double-spaced) / setup line /
 * Objective · / Map · / species motto.
 */
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { difficultyCopy, t } from '../../i18n';

export function pauseDifficultyTipLine(difficulty: AiDifficultyId): string {
  const d = difficultyCopy(difficulty);
  return t('pause.difficultyTip', { label: d.label, blurb: d.blurb });
}
