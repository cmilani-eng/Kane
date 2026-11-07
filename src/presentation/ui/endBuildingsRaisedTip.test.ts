import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endBuildingsRaisedTipLine } from './endBuildingsRaisedTip';

describe('endBuildingsRaisedTipLine', () => {
  it('formats Raised · n from construction completions', () => {
    expect(endBuildingsRaisedTipLine(3)).toBe(t('end.raisedTip', { n: 3 }));
    expect(endBuildingsRaisedTipLine(3)).toMatch(/^Raised ·/);
    expect(endBuildingsRaisedTipLine(0)).toBe(t('end.raisedTip', { n: 0 }));
  });
});
