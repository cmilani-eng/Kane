import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endUnitsLostTipLine } from './endUnitsLostTip';

describe('endUnitsLostTipLine', () => {
  it('formats Lost · n from player unit removals', () => {
    expect(endUnitsLostTipLine(7)).toBe(t('end.lostTip', { n: 7 }));
    expect(endUnitsLostTipLine(7)).toMatch(/^Lost ·/);
    expect(endUnitsLostTipLine(0)).toBe(t('end.lostTip', { n: 0 }));
  });
});
