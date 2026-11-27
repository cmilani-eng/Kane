/**
 * End-screen difficulty played tip (HUD label only).
 * Format: Difficulty · {label} — middot (U+00B7) from match difficulty.
 * Distinct from Last difficulty · / lobby-pause {label} · {blurb} / Objective · /
 * Map · / meta map · difficulty · clock.
 */
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { difficultyCopy, t } from '../../i18n';

/** Difficulty · {label} — difficulty played this match (middot U+00B7). */
export function endDifficultyPlayedTipLine(
  difficulty: AiDifficultyId,
): string {
  return t('end.difficultyTip', {
    label: difficultyCopy(difficulty).label,
  });
}
