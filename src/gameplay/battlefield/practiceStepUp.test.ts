import { describe, expect, it } from 'vitest';
import { offerPracticeStepUp } from './practiceStepUp';

describe('practice step up', () => {
  it('offers Easy only after a Practice win', () => {
    expect(offerPracticeStepUp(true, 'practice')).toBe(true);
    expect(offerPracticeStepUp(false, 'practice')).toBe(false);
    expect(offerPracticeStepUp(true, 'easy')).toBe(false);
    expect(offerPracticeStepUp(true, 'normal')).toBe(false);
    expect(offerPracticeStepUp(true, 'hard')).toBe(false);
  });
});
