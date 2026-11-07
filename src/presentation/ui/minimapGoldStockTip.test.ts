import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { pauseStockTipLine } from './pauseStockTip';
import { minimapCrystalStockTipText } from './minimapCrystalStockTip';
import { minimapGoldStockTipText } from './minimapGoldStockTip';

describe('minimapGoldStockTipText', () => {
  it('labels Gold · n, distinct from Crystal and pause stock combo', () => {
    expect(minimapGoldStockTipText(220)).toBe(t('hud.minimapGold', { n: 220 }));
    expect(minimapGoldStockTipText(220)).toMatch(/^Gold ·/);
    expect(minimapGoldStockTipText(0)).toBe(t('hud.minimapGold', { n: 0 }));
    expect(minimapGoldStockTipText(220)).not.toBe(
      minimapCrystalStockTipText(220),
    );
    expect(minimapGoldStockTipText(220)).not.toBe(
      pauseStockTipLine(220, 40),
    );
  });
});
