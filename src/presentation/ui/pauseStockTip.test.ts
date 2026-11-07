import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { pauseStockTipLine } from './pauseStockTip';

describe('pauseStockTipLine', () => {
  it('labels Gold · n · Crystal · m', () => {
    expect(pauseStockTipLine(120, 45)).toBe(
      t('pause.stockTip', { gold: 120, crystals: 45 }),
    );
    expect(pauseStockTipLine(120, 45)).toMatch(/^Gold ·/);
    expect(pauseStockTipLine(120, 45)).toContain('Crystal ·');
    expect(pauseStockTipLine(0, 0)).toBe(
      t('pause.stockTip', { gold: 0, crystals: 0 }),
    );
  });
});
