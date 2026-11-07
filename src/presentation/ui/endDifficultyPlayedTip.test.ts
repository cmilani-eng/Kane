import { describe, expect, it } from 'vitest';
import { difficultyCopy, t } from '../../i18n';
import { endDifficultyPlayedTipLine } from './endDifficultyPlayedTip';

describe('endDifficultyPlayedTipLine', () => {
  it('labels the difficulty that was played', () => {
    const label = difficultyCopy('hard').label;
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label }),
    );
    expect(endDifficultyPlayedTipLine('hard')).toContain(label);
  });
});
