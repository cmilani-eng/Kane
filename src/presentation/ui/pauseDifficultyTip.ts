/**
 * Pause overlay difficulty tip (HUD label only).
 * Distinct from the setup species · map · difficulty line.
 */
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { difficultyCopy, t } from '../../i18n';

export function pauseDifficultyTipLine(difficulty: AiDifficultyId): string {
  const d = difficultyCopy(difficulty);
  return t('pause.difficultyTip', { label: d.label, blurb: d.blurb });
}
