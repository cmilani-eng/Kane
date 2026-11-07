import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endBuildingsLostTipLine } from './endBuildingsLostTip';

describe('endBuildingsLostTipLine', () => {
  it('formats Razed · n from player building destructions', () => {
    expect(endBuildingsLostTipLine(2)).toBe(t('end.bldLostTip', { n: 2 }));
    expect(endBuildingsLostTipLine(2)).toMatch(/^Razed ·/);
    expect(endBuildingsLostTipLine(0)).toBe(t('end.bldLostTip', { n: 0 }));
  });
});
