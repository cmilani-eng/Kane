import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endResourcesGatheredTipLine } from './endResourcesGatheredTip';

describe('endResourcesGatheredTipLine', () => {
  it('sums gold and crystals as Gathered · n', () => {
    expect(endResourcesGatheredTipLine(120, 45)).toBe(
      t('end.gatheredTip', { n: 165 }),
    );
    expect(endResourcesGatheredTipLine(120, 45)).toMatch(/^Gathered ·/);
    expect(endResourcesGatheredTipLine(0, 0)).toBe(
      t('end.gatheredTip', { n: 0 }),
    );
  });
});
