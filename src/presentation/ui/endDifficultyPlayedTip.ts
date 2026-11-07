/**
 * End-screen difficulty played tip (HUD label only).
 * Distinct from the meta map · difficulty · clock line.
 */
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { difficultyCopy, t } from '../../i18n';

export function endDifficultyPlayedTipLine(
  difficulty: AiDifficultyId,
): string {
  return t('end.difficultyTip', {
    label: difficultyCopy(difficulty).label,
  });
}
