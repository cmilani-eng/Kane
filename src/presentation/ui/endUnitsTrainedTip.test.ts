import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endUnitsTrainedTipLine } from './endUnitsTrainedTip';

describe('endUnitsTrainedTipLine', () => {
  it('labels Trained · n for the end screen tip', () => {
    expect(endUnitsTrainedTipLine(12)).toBe(t('end.trainedTip', { n: 12 }));
    expect(endUnitsTrainedTipLine(12)).toMatch(/^Trained ·/);
    expect(endUnitsTrainedTipLine(0)).toBe(t('end.trainedTip', { n: 0 }));
  });
});
