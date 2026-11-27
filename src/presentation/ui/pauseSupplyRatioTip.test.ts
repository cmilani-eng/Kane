import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapSupplyTipText } from './minimapSupplyTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';
import { formatSupplyLine } from './supplyTone';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseSupplyRatioTipLine', () => {
  it('labels Supply · used/cap with middot, distinct from Pop · / Army · / Selected ·', () => {
    expect(pauseSupplyRatioTipLine(18, 36)).toBe(
      t('pause.supplyRatioTip', { used: 18, cap: 36 }),
    );
    expect(pauseSupplyRatioTipLine(18, 36)).toBe('Supply · 18/36');
    expect(pauseSupplyRatioTipLine(18, 36)).toMatch(/^Supply \u00b7 /);
    expect(pauseSupplyRatioTipLine(18, 36)).toContain('18/36');
    expect(pauseSupplyRatioTipLine(0, 0)).toBe(
      t('pause.supplyRatioTip', { used: 0, cap: 0 }),
    );
    expect(pauseSupplyRatioTipLine(0, 0)).toBe('Supply · 0/0');
    expect(pauseSupplyRatioTipLine(0, 0)).toMatch(/^Supply \u00b7 /);

    const tip = pauseSupplyRatioTipLine(18, 36);
    expect(tip).not.toBe(formatSupplyLine(18, 36));
    expect(tip).not.toBe(pausePopulationTipLine(18));
    expect(tip).not.toBe(pauseArmySizeTipLine(18));
    expect(tip).not.toBe(pauseSelectionCountTipLine(18));
    expect(tip).not.toMatch(/^Pop \u00b7 /);
    expect(tip).not.toMatch(/^Army \u00b7 /);
    expect(tip).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(tip).toBe(minimapSupplyTipText(18, 36));
    expect(minimapSupplyTipText(18, 36)).toBe(
      t('hud.minimapSupply', { used: 18, cap: 36 }),
    );
    expect(minimapSupplyTipText(18, 36)).toBe('Supply · 18/36');
    expect(minimapSupplyTipText(18, 36)).toMatch(/^Supply \u00b7 /);
    expect(t('pause.supplyRatioTip', { used: 1, cap: 2 })).toBe(
      t('hud.minimapSupply', { used: 1, cap: 2 }),
    );
  });

  it('localizes Supply middot for pt-BR and es; stays distinct from Pop / Army / Selected', () => {
    setLocale('pt-BR');
    expect(pauseSupplyRatioTipLine(18, 36)).toBe(
      t('pause.supplyRatioTip', { used: 18, cap: 36 }),
    );
    expect(pauseSupplyRatioTipLine(18, 36)).toBe('Suprimento · 18/36');
    expect(pauseSupplyRatioTipLine(18, 36)).toMatch(/^Suprimento \u00b7 /);

    const tipPt = pauseSupplyRatioTipLine(18, 36);
    expect(tipPt).not.toBe(formatSupplyLine(18, 36));
    expect(tipPt).not.toBe(pausePopulationTipLine(18));
    expect(tipPt).not.toBe(pauseArmySizeTipLine(18));
    expect(tipPt).not.toBe(pauseSelectionCountTipLine(18));
    expect(tipPt).not.toMatch(/^Pop \u00b7 /);
    expect(tipPt).not.toMatch(/^Tropa \u00b7 /);
    expect(tipPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(tipPt).toBe(minimapSupplyTipText(18, 36));
    expect(minimapSupplyTipText(18, 36)).toBe(
      t('hud.minimapSupply', { used: 18, cap: 36 }),
    );

    setLocale('es');
    expect(pauseSupplyRatioTipLine(18, 36)).toBe(
      t('pause.supplyRatioTip', { used: 18, cap: 36 }),
    );
    expect(pauseSupplyRatioTipLine(18, 36)).toBe('Suministro · 18/36');
    expect(pauseSupplyRatioTipLine(18, 36)).toMatch(/^Suministro \u00b7 /);

    const tipEs = pauseSupplyRatioTipLine(18, 36);
    expect(tipEs).not.toBe(formatSupplyLine(18, 36));
    expect(tipEs).not.toBe(pausePopulationTipLine(18));
    expect(tipEs).not.toBe(pauseArmySizeTipLine(18));
    expect(tipEs).not.toBe(pauseSelectionCountTipLine(18));
    expect(tipEs).not.toMatch(/^Pop \u00b7 /);
    expect(tipEs).not.toMatch(/^Tropa \u00b7 /);
    expect(tipEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(tipEs).toBe(minimapSupplyTipText(18, 36));
    expect(minimapSupplyTipText(18, 36)).toBe(
      t('hud.minimapSupply', { used: 18, cap: 36 }),
    );
    setLocale('en-GB');
  });
});
