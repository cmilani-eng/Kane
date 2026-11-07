import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { endVisionTipLine } from './endVisionTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { unitVisionLabel } from './unitVision';

describe('endVisionTipLine', () => {
  it('labels Vision · n, distinct from selection Sight · / minimap key', () => {
    expect(endVisionTipLine(5)).toBe(t('end.visionTip', { n: 5 }));
    expect(endVisionTipLine(5)).toMatch(/^Vision \u00b7 /);
    expect(endVisionTipLine(0)).toBe(t('end.visionTip', { n: 0 }));
    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(endVisionTipLine(5)).toBe(minimapVisionTipText(5));
    expect(minimapVisionTipText(5)).toBe(t('hud.minimapVision', { n: 5 }));
    expect(endVisionTipLine(5)).not.toBe(t('sel.visionTip', { n: 5 }));
    expect(endVisionTipLine(5)).not.toBe(unitVisionLabel('scavenger'));
  });

  it('localizes Vision middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(endVisionTipLine(4)).toBe('Visão · 4');
    expect(endVisionTipLine(4)).toBe(t('end.visionTip', { n: 4 }));
    expect(endVisionTipLine(4)).toMatch(/^Visão \u00b7 /);
    setLocale('es');
    expect(endVisionTipLine(4)).toBe('Visión · 4');
    expect(endVisionTipLine(4)).toBe(t('end.visionTip', { n: 4 }));
    expect(endVisionTipLine(4)).toMatch(/^Visión \u00b7 /);
    setLocale('en-GB');
    expect(endVisionTipLine(4)).toBe('Vision · 4');
  });
});
