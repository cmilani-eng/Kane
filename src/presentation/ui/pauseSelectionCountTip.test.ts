import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

describe('pauseSelectionCountTipLine', () => {
  it('labels Selected · n', () => {
    expect(pauseSelectionCountTipLine(4)).toBe(
      t('pause.selectionCountTip', { n: 4 }),
    );
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Selected ·/);
    expect(pauseSelectionCountTipLine(0)).toBe(
      t('pause.selectionCountTip', { n: 0 }),
    );
  });
});
