import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { pauseStockTipLine } from './pauseStockTip';
import { minimapCrystalStockTipText } from './minimapCrystalStockTip';

describe('minimapCrystalStockTipText', () => {
  it('labels Crystal · n, distinct from pause stock combo', () => {
    expect(minimapCrystalStockTipText(12)).toBe(
      t('hud.minimapCrystal', { n: 12 }),
    );
    expect(minimapCrystalStockTipText(12)).toMatch(/^Crystal ·/);
    expect(minimapCrystalStockTipText(0)).toBe(
      t('hud.minimapCrystal', { n: 0 }),
    );
    expect(minimapCrystalStockTipText(12)).not.toBe(
      pauseStockTipLine(100, 12),
    );
  });
});
