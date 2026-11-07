import type { AiDifficultyId } from './aiDifficulty';

const STEP_UP: Partial<Record<AiDifficultyId, AiDifficultyId>> = {
  practice: 'easy',
  easy: 'normal',
  normal: 'hard',
};

const STEP_DOWN: Partial<Record<AiDifficultyId, AiDifficultyId>> = {
  hard: 'normal',
  normal: 'easy',
  easy: 'practice',
};

/** Next difficulty after a win. A loss, or a Hard win, stays put. */
export function nextDifficultyAfterWin(
  win: boolean,
  difficulty: AiDifficultyId,
): AiDifficultyId | null {
  if (!win) return null;
  return STEP_UP[difficulty] ?? null;
}

/** Previous difficulty after a loss. A win, or a Practice loss, stays put. */
export function previousDifficultyAfterLoss(
  win: boolean,
  difficulty: AiDifficultyId,
): AiDifficultyId | null {
  if (win) return null;
  return STEP_DOWN[difficulty] ?? null;
}

/** A Practice win is the moment to offer Easy. */
export function offerPracticeStepUp(
  win: boolean,
  difficulty: AiDifficultyId,
): boolean {
  return nextDifficultyAfterWin(win, difficulty) === 'easy';
}
