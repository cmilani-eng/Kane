import type { AiDifficultyId } from './aiDifficulty';

const STEP_UP: Partial<Record<AiDifficultyId, AiDifficultyId>> = {
  practice: 'easy',
  easy: 'normal',
  normal: 'hard',
};

/** Next difficulty after a win. A loss, or a Hard win, stays put. */
export function nextDifficultyAfterWin(
  win: boolean,
  difficulty: AiDifficultyId,
): AiDifficultyId | null {
  if (!win) return null;
  return STEP_UP[difficulty] ?? null;
}

/** A Practice win is the moment to offer Easy. */
export function offerPracticeStepUp(
  win: boolean,
  difficulty: AiDifficultyId,
): boolean {
  return nextDifficultyAfterWin(win, difficulty) === 'easy';
}
