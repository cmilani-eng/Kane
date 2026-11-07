import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { pauseStockTipLine } from './pauseStockTip';
import { minimapCrystalStockTipText } from './minimapCrystalStockTip';
import { minimapGoldStockTipText } from './minimapGoldStockTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';

describe('minimapGoldStockTipText', () => {
  it('labels Gold · n with middot, distinct from Crystal · / Selected · / pause stock', () => {
    expect(minimapGoldStockTipText(220)).toBe(
      t('hud.minimapGold', { n: 220 }),
    );
    expect(minimapGoldStockTipText(220)).toBe('Gold · 220');
    expect(minimapGoldStockTipText(220)).toMatch(/^Gold \u00b7 /);
    expect(minimapGoldStockTipText(0)).toBe(
      t('hud.minimapGold', { n: 0 }),
    );
    expect(minimapGoldStockTipText(0)).toBe('Gold · 0');
    expect(minimapGoldStockTipText(0)).toMatch(/^Gold \u00b7 /);

    const gold = minimapGoldStockTipText(220);
    expect(gold).not.toBe(minimapCrystalStockTipText(220));
    expect(gold).not.toBe(minimapSelectedCountTipText(220));
    expect(gold).not.toBe(pauseStockTipLine(220, 40));
    expect(gold).not.toMatch(/^Crystal \u00b7 /);
    expect(gold).not.toMatch(/^Selected \u00b7 /);
    expect(gold).not.toMatch(/^Gold \u00b7 .* · Crystal \u00b7 /);
  });

  it('localizes Gold middot for pt-BR and es; stays distinct from Crystal / Selected / pause stock', () => {
    setLocale('pt-BR');
    expect(minimapGoldStockTipText(220)).toBe(
      t('hud.minimapGold', { n: 220 }),
    );
    expect(minimapGoldStockTipText(220)).toBe('Ouro · 220');
    expect(minimapGoldStockTipText(220)).toMatch(/^Ouro \u00b7 /);

    const goldPt = minimapGoldStockTipText(220);
    expect(goldPt).not.toBe(minimapCrystalStockTipText(220));
    expect(goldPt).not.toBe(minimapSelectedCountTipText(220));
    expect(goldPt).not.toBe(pauseStockTipLine(220, 40));
    expect(goldPt).not.toMatch(/^Cristal \u00b7 /);
    expect(goldPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(goldPt).not.toMatch(/^Ouro \u00b7 .* · Cristal \u00b7 /);

    setLocale('es');
    expect(minimapGoldStockTipText(220)).toBe(
      t('hud.minimapGold', { n: 220 }),
    );
    expect(minimapGoldStockTipText(220)).toBe('Oro · 220');
    expect(minimapGoldStockTipText(220)).toMatch(/^Oro \u00b7 /);

    const goldEs = minimapGoldStockTipText(220);
    expect(goldEs).not.toBe(minimapCrystalStockTipText(220));
    expect(goldEs).not.toBe(minimapSelectedCountTipText(220));
    expect(goldEs).not.toBe(pauseStockTipLine(220, 40));
    expect(goldEs).not.toMatch(/^Cristal \u00b7 /);
    expect(goldEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(goldEs).not.toMatch(/^Oro \u00b7 .* · Cristal \u00b7 /);
    setLocale('en-GB');
  });
});
