import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';

describe('pausePopulationTipLine', () => {
  it('labels Pop · n', () => {
    expect(pausePopulationTipLine(12)).toBe(t('pause.populationTip', { n: 12 }));
    expect(pausePopulationTipLine(12)).toMatch(/^Pop ·/);
    expect(pausePopulationTipLine(0)).toBe(t('pause.populationTip', { n: 0 }));
    expect(pausePopulationTipLine(12)).not.toBe(
      pauseSupplyRatioTipLine(12, 36),
    );
  });
});
