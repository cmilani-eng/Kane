import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { pauseStockTipLine } from './pauseStockTip';
import { minimapCrystalStockTipText } from './minimapCrystalStockTip';
import { minimapGoldStockTipText } from './minimapGoldStockTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';

describe('minimapCrystalStockTipText', () => {
  it('labels Crystal · n with middot, distinct from Gold · / Selected · / pause stock', () => {
    expect(minimapCrystalStockTipText(12)).toBe(
      t('hud.minimapCrystal', { n: 12 }),
    );
    expect(minimapCrystalStockTipText(12)).toBe('Crystal · 12');
    expect(minimapCrystalStockTipText(12)).toMatch(/^Crystal \u00b7 /);
    expect(minimapCrystalStockTipText(0)).toBe(
      t('hud.minimapCrystal', { n: 0 }),
    );
    expect(minimapCrystalStockTipText(0)).toBe('Crystal · 0');
    expect(minimapCrystalStockTipText(0)).toMatch(/^Crystal \u00b7 /);

    const crystal = minimapCrystalStockTipText(12);
    expect(crystal).not.toBe(minimapGoldStockTipText(12));
    expect(crystal).not.toBe(minimapSelectedCountTipText(12));
    expect(crystal).not.toBe(pauseStockTipLine(100, 12));
    expect(crystal).not.toMatch(/^Gold \u00b7 /);
    expect(crystal).not.toMatch(/^Selected \u00b7 /);
    expect(crystal).not.toMatch(/^Gold \u00b7 .* · Crystal \u00b7 /);
  });

  it('localizes Crystal middot for pt-BR and es; stays distinct from Gold / Selected / pause stock', () => {
    setLocale('pt-BR');
    expect(minimapCrystalStockTipText(12)).toBe(
      t('hud.minimapCrystal', { n: 12 }),
    );
    expect(minimapCrystalStockTipText(12)).toBe('Cristal · 12');
    expect(minimapCrystalStockTipText(12)).toMatch(/^Cristal \u00b7 /);

    const crystalPt = minimapCrystalStockTipText(12);
    expect(crystalPt).not.toBe(minimapGoldStockTipText(12));
    expect(crystalPt).not.toBe(minimapSelectedCountTipText(12));
    expect(crystalPt).not.toBe(pauseStockTipLine(100, 12));
    expect(crystalPt).not.toMatch(/^Ouro \u00b7 /);
    expect(crystalPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(crystalPt).not.toMatch(/^Ouro \u00b7 .* · Cristal \u00b7 /);

    setLocale('es');
    expect(minimapCrystalStockTipText(12)).toBe(
      t('hud.minimapCrystal', { n: 12 }),
    );
    expect(minimapCrystalStockTipText(12)).toBe('Cristal · 12');
    expect(minimapCrystalStockTipText(12)).toMatch(/^Cristal \u00b7 /);

    const crystalEs = minimapCrystalStockTipText(12);
    expect(crystalEs).not.toBe(minimapGoldStockTipText(12));
    expect(crystalEs).not.toBe(minimapSelectedCountTipText(12));
    expect(crystalEs).not.toBe(pauseStockTipLine(100, 12));
    expect(crystalEs).not.toMatch(/^Oro \u00b7 /);
    expect(crystalEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(crystalEs).not.toMatch(/^Oro \u00b7 .* · Cristal \u00b7 /);
    setLocale('en-GB');
  });
});
