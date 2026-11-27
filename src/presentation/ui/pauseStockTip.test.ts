import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapCrystalStockTipText } from './minimapCrystalStockTip';
import { minimapGoldStockTipText } from './minimapGoldStockTip';
import { pauseStockTipLine } from './pauseStockTip';

describe('pauseStockTipLine', () => {
  it('labels Gold · n · Crystal · m with middot, distinct from Gold · / Crystal · singles', () => {
    const line = pauseStockTipLine(120, 45);
    expect(line).toBe(t('pause.stockTip', { gold: 120, crystals: 45 }));
    expect(line).toBe('Gold · 120 · Crystal · 45');
    expect(line).toMatch(/^Gold \u00b7 /);
    expect(line).toMatch(/ · Crystal \u00b7 /);
    expect(pauseStockTipLine(0, 0)).toBe(
      t('pause.stockTip', { gold: 0, crystals: 0 }),
    );
    expect(pauseStockTipLine(0, 0)).toBe('Gold · 0 · Crystal · 0');
    expect(pauseStockTipLine(0, 0)).toMatch(/^Gold \u00b7 /);
    expect(pauseStockTipLine(0, 0)).toMatch(/ · Crystal \u00b7 /);

    // Floors fractional wallets and clamps negatives.
    expect(pauseStockTipLine(12.9, -3)).toBe('Gold · 12 · Crystal · 0');

    expect(line).not.toBe(minimapGoldStockTipText(120));
    expect(line).not.toBe(minimapCrystalStockTipText(45));
    expect(minimapGoldStockTipText(120)).toBe('Gold · 120');
    expect(minimapGoldStockTipText(120)).toMatch(/^Gold \u00b7 /);
    expect(minimapCrystalStockTipText(45)).toBe('Crystal · 45');
    expect(minimapCrystalStockTipText(45)).toMatch(/^Crystal \u00b7 /);
    // Combo tip is not a lone Gold · or Crystal · label.
    expect(line).not.toMatch(/^Crystal \u00b7 /);
    expect(line).not.toBe(`Gold · 120`);
    expect(line).not.toBe(`Crystal · 45`);
  });

  it('localizes Gold · Crystal middot for pt-BR and es; stays distinct from Gold / Crystal singles', () => {
    setLocale('pt-BR');
    const pt = pauseStockTipLine(120, 45);
    expect(pt).toBe(t('pause.stockTip', { gold: 120, crystals: 45 }));
    expect(pt).toBe('Ouro · 120 · Cristal · 45');
    expect(pt).toMatch(/^Ouro \u00b7 /);
    expect(pt).toMatch(/ · Cristal \u00b7 /);
    expect(pt).not.toBe(minimapGoldStockTipText(120));
    expect(pt).not.toBe(minimapCrystalStockTipText(45));
    expect(minimapGoldStockTipText(120)).toBe('Ouro · 120');
    expect(minimapGoldStockTipText(120)).toMatch(/^Ouro \u00b7 /);
    expect(minimapCrystalStockTipText(45)).toBe('Cristal · 45');
    expect(minimapCrystalStockTipText(45)).toMatch(/^Cristal \u00b7 /);
    expect(pt).not.toMatch(/^Cristal \u00b7 /);
    expect(pt).not.toBe(`Ouro · 120`);
    expect(pt).not.toBe(`Cristal · 45`);

    setLocale('es');
    const es = pauseStockTipLine(120, 45);
    expect(es).toBe(t('pause.stockTip', { gold: 120, crystals: 45 }));
    expect(es).toBe('Oro · 120 · Cristal · 45');
    expect(es).toMatch(/^Oro \u00b7 /);
    expect(es).toMatch(/ · Cristal \u00b7 /);
    expect(es).not.toBe(minimapGoldStockTipText(120));
    expect(es).not.toBe(minimapCrystalStockTipText(45));
    expect(minimapGoldStockTipText(120)).toBe('Oro · 120');
    expect(minimapGoldStockTipText(120)).toMatch(/^Oro \u00b7 /);
    expect(minimapCrystalStockTipText(45)).toBe('Cristal · 45');
    expect(minimapCrystalStockTipText(45)).toMatch(/^Cristal \u00b7 /);
    expect(es).not.toMatch(/^Cristal \u00b7 /);
    expect(es).not.toBe(`Oro · 120`);
    expect(es).not.toBe(`Cristal · 45`);
    setLocale('en-GB');
  });
});
