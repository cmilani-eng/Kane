import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { minimapSupplyTipText } from './minimapSupplyTip';
import { pauseSupplyRatioTipLine } from './pauseSupplyRatioTip';
import { formatSupplyLine } from './supplyTone';

beforeEach(() => {
  setLocale('en-GB');
});

describe('minimapSupplyTipText', () => {
  it('labels Supply · used/cap with middot, distinct from Pop · / Army · / Selected ·', () => {
    expect(minimapSupplyTipText(18, 36)).toBe(
      t('hud.minimapSupply', { used: 18, cap: 36 }),
    );
    expect(minimapSupplyTipText(18, 36)).toBe('Supply · 18/36');
    expect(minimapSupplyTipText(18, 36)).toMatch(/^Supply \u00b7 /);
    expect(minimapSupplyTipText(18, 36)).toContain('18/36');
    expect(minimapSupplyTipText(0, 0)).toBe(
      t('hud.minimapSupply', { used: 0, cap: 0 }),
    );
    expect(minimapSupplyTipText(0, 0)).toBe('Supply · 0/0');
    expect(minimapSupplyTipText(0, 0)).toMatch(/^Supply \u00b7 /);

    const tip = minimapSupplyTipText(18, 36);
    expect(tip).not.toBe(formatSupplyLine(18, 36));
    expect(tip).not.toBe(minimapPopulationTipText(18));
    expect(tip).not.toBe(minimapArmyCountTipText(18));
    expect(tip).not.toBe(minimapSelectedCountTipText(18));
    expect(tip).not.toMatch(/^Pop \u00b7 /);
    expect(tip).not.toMatch(/^Army \u00b7 /);
    expect(tip).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(tip).toBe(pauseSupplyRatioTipLine(18, 36));
    expect(pauseSupplyRatioTipLine(18, 36)).toBe(
      t('pause.supplyRatioTip', { used: 18, cap: 36 }),
    );
    expect(pauseSupplyRatioTipLine(18, 36)).toBe('Supply · 18/36');
    expect(pauseSupplyRatioTipLine(18, 36)).toMatch(/^Supply \u00b7 /);
    expect(t('hud.minimapSupply', { used: 1, cap: 2 })).toBe(
      t('pause.supplyRatioTip', { used: 1, cap: 2 }),
    );
  });

  it('localizes Supply middot for pt-BR and es; stays distinct from Pop / Army / Selected', () => {
    setLocale('pt-BR');
    expect(minimapSupplyTipText(18, 36)).toBe(
      t('hud.minimapSupply', { used: 18, cap: 36 }),
    );
    expect(minimapSupplyTipText(18, 36)).toBe('Suprimento · 18/36');
    expect(minimapSupplyTipText(18, 36)).toMatch(/^Suprimento \u00b7 /);

    const tipPt = minimapSupplyTipText(18, 36);
    expect(tipPt).not.toBe(formatSupplyLine(18, 36));
    expect(tipPt).not.toBe(minimapPopulationTipText(18));
    expect(tipPt).not.toBe(minimapArmyCountTipText(18));
    expect(tipPt).not.toBe(minimapSelectedCountTipText(18));
    expect(tipPt).not.toMatch(/^Pop \u00b7 /);
    expect(tipPt).not.toMatch(/^Tropa \u00b7 /);
    expect(tipPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(tipPt).toBe(pauseSupplyRatioTipLine(18, 36));
    expect(pauseSupplyRatioTipLine(18, 36)).toBe(
      t('pause.supplyRatioTip', { used: 18, cap: 36 }),
    );

    setLocale('es');
    expect(minimapSupplyTipText(18, 36)).toBe(
      t('hud.minimapSupply', { used: 18, cap: 36 }),
    );
    expect(minimapSupplyTipText(18, 36)).toBe('Suministro · 18/36');
    expect(minimapSupplyTipText(18, 36)).toMatch(/^Suministro \u00b7 /);

    const tipEs = minimapSupplyTipText(18, 36);
    expect(tipEs).not.toBe(formatSupplyLine(18, 36));
    expect(tipEs).not.toBe(minimapPopulationTipText(18));
    expect(tipEs).not.toBe(minimapArmyCountTipText(18));
    expect(tipEs).not.toBe(minimapSelectedCountTipText(18));
    expect(tipEs).not.toMatch(/^Pop \u00b7 /);
    expect(tipEs).not.toMatch(/^Tropa \u00b7 /);
    expect(tipEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(tipEs).toBe(pauseSupplyRatioTipLine(18, 36));
    expect(pauseSupplyRatioTipLine(18, 36)).toBe(
      t('pause.supplyRatioTip', { used: 18, cap: 36 }),
    );
    setLocale('en-GB');
  });
});
