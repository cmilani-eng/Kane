import { describe, expect, it } from 'vitest';
import { difficultyCopy, t } from '../../i18n';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';

describe('pauseDifficultyTipLine', () => {
  it('labels difficulty with its blurb', () => {
    const d = difficultyCopy('hard');
    expect(pauseDifficultyTipLine('hard')).toBe(
      t('pause.difficultyTip', { label: d.label, blurb: d.blurb }),
    );
    expect(pauseDifficultyTipLine('hard')).toContain(d.label);
    expect(pauseDifficultyTipLine('hard')).toContain(d.blurb);
  });
});
