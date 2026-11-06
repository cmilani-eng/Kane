import type { AiDifficultyId } from './aiDifficulty';

/** A Practice win is the moment to offer Easy. Losses and other difficulties stay put. */
export function offerPracticeStepUp(
  win: boolean,
  difficulty: AiDifficultyId,
): boolean {
  return win && difficulty === 'practice';
}
