import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { pauseStockTipLine } from './pauseStockTip';
import { minimapCrystalStockTipText } from './minimapCrystalStockTip';
import { minimapGoldStockTipText } from './minimapGoldStockTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('minimapGoldStockTipText', () => {
  it('labels Gold · n with middot, distinct from Crystal · / Selected · / pause stock', () => {
    const gold = minimapGoldStockTipText(220);
    expect(gold).toBe(t('hud.minimapGold', { n: 220 }));
    expect(gold).toBe('Gold · 220');
    expect(gold).toMatch(/^Gold \u00b7 /);
    expect(gold).toMatch(/^Gold \u00b7 220$/);
    expect(gold).toContain(' \u00b7 ');
    expect(gold).not.toContain('  ·  ');
    expect(gold).not.toMatch(/ {2}/);

    const zero = minimapGoldStockTipText(0);
    expect(zero).toBe(t('hud.minimapGold', { n: 0 }));
    expect(zero).toBe('Gold · 0');
    expect(zero).toMatch(/^Gold \u00b7 0$/);
    expect(zero).toContain(' \u00b7 ');
    expect(zero).not.toContain('  ·  ');

    // Distinct from Crystal · / Selected · / pause Gold · Crystal combo.
    expect(gold).not.toBe(minimapCrystalStockTipText(220));
    expect(minimapCrystalStockTipText(220)).toBe('Crystal · 220');
    expect(minimapCrystalStockTipText(220)).toMatch(/^Crystal \u00b7 /);
    expect(gold).not.toBe(minimapSelectedCountTipText(220));
    expect(minimapSelectedCountTipText(220)).toBe('Selected · 220');
    expect(minimapSelectedCountTipText(220)).toMatch(/^Selected \u00b7 /);
    expect(gold).not.toBe(pauseStockTipLine(220, 40));
    expect(pauseStockTipLine(220, 40)).toBe('Gold · 220 · Crystal · 40');
    expect(pauseStockTipLine(220, 40)).toMatch(/^Gold \u00b7 .* · Crystal \u00b7 /);
    expect(gold).not.toMatch(/^Crystal \u00b7 /);
    expect(gold).not.toMatch(/^Selected \u00b7 /);
    expect(gold).not.toMatch(/^Gold \u00b7 .* · Crystal \u00b7 /);
  });

  it('localizes Gold · middot for pt-BR and es; stays distinct from Crystal · / Selected · / pause stock', () => {
    setLocale('pt-BR');
    const goldPt = minimapGoldStockTipText(220);
    expect(goldPt).toBe(t('hud.minimapGold', { n: 220 }));
    expect(goldPt).toBe('Ouro · 220');
    expect(goldPt).toMatch(/^Ouro \u00b7 /);
    expect(goldPt).toMatch(/^Ouro \u00b7 220$/);
    expect(goldPt).toContain(' \u00b7 ');
    expect(goldPt).not.toContain('  ·  ');

    expect(goldPt).not.toBe(minimapCrystalStockTipText(220));
    expect(minimapCrystalStockTipText(220)).toBe('Cristal · 220');
    expect(minimapCrystalStockTipText(220)).toMatch(/^Cristal \u00b7 /);
    expect(goldPt).not.toBe(minimapSelectedCountTipText(220));
    expect(minimapSelectedCountTipText(220)).toBe('Selecionados · 220');
    expect(minimapSelectedCountTipText(220)).toMatch(/^Selecionados \u00b7 /);
    expect(goldPt).not.toBe(pauseStockTipLine(220, 40));
    expect(pauseStockTipLine(220, 40)).toBe('Ouro · 220 · Cristal · 40');
    expect(pauseStockTipLine(220, 40)).toMatch(/^Ouro \u00b7 .* · Cristal \u00b7 /);
    expect(goldPt).not.toMatch(/^Cristal \u00b7 /);
    expect(goldPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(goldPt).not.toMatch(/^Ouro \u00b7 .* · Cristal \u00b7 /);

    setLocale('es');
    const goldEs = minimapGoldStockTipText(220);
    expect(goldEs).toBe(t('hud.minimapGold', { n: 220 }));
    expect(goldEs).toBe('Oro · 220');
    expect(goldEs).toMatch(/^Oro \u00b7 /);
    expect(goldEs).toMatch(/^Oro \u00b7 220$/);
    expect(goldEs).toContain(' \u00b7 ');
    expect(goldEs).not.toContain('  ·  ');

    expect(goldEs).not.toBe(minimapCrystalStockTipText(220));
    expect(minimapCrystalStockTipText(220)).toBe('Cristal · 220');
    expect(minimapCrystalStockTipText(220)).toMatch(/^Cristal \u00b7 /);
    expect(goldEs).not.toBe(minimapSelectedCountTipText(220));
    expect(minimapSelectedCountTipText(220)).toBe('Seleccionados · 220');
    expect(minimapSelectedCountTipText(220)).toMatch(/^Seleccionados \u00b7 /);
    expect(goldEs).not.toBe(pauseStockTipLine(220, 40));
    expect(pauseStockTipLine(220, 40)).toBe('Oro · 220 · Cristal · 40');
    expect(pauseStockTipLine(220, 40)).toMatch(/^Oro \u00b7 .* · Cristal \u00b7 /);
    expect(goldEs).not.toMatch(/^Cristal \u00b7 /);
    expect(goldEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(goldEs).not.toMatch(/^Oro \u00b7 .* · Cristal \u00b7 /);
  });
});
