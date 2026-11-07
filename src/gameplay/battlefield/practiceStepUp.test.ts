import { describe, expect, it } from 'vitest';
import { nextDifficultyAfterWin, offerPracticeStepUp } from './practiceStepUp';

describe('difficulty step up', () => {
  it('walks one step up the ladder after a win', () => {
    expect(nextDifficultyAfterWin(true, 'practice')).toBe('easy');
    expect(nextDifficultyAfterWin(true, 'easy')).toBe('normal');
    expect(nextDifficultyAfterWin(true, 'normal')).toBe('hard');
    expect(nextDifficultyAfterWin(true, 'hard')).toBeNull();
  });

  it('stays put after a loss', () => {
    expect(nextDifficultyAfterWin(false, 'practice')).toBeNull();
    expect(nextDifficultyAfterWin(false, 'easy')).toBeNull();
    expect(nextDifficultyAfterWin(false, 'normal')).toBeNull();
    expect(nextDifficultyAfterWin(false, 'hard')).toBeNull();
  });

  it('still treats a Practice win as the offer of Easy', () => {
    expect(offerPracticeStepUp(true, 'practice')).toBe(true);
    expect(offerPracticeStepUp(false, 'practice')).toBe(false);
    expect(offerPracticeStepUp(true, 'easy')).toBe(false);
  });
});
