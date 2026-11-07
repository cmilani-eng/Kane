import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { pauseFogAgeTipLine } from './pauseFogAgeTip';
import { pauseFogCoverageTipLine } from './pauseFogCoverageTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseFogCoverageTipLine', () => {
  it('labels Fog · pct% with middot, distinct from Fog · ns / Fog age · / Vision · / Selected ·', () => {
    expect(pauseFogCoverageTipLine(42)).toBe(
      t('pause.fogCoverageTip', { pct: 42 }),
    );
    expect(pauseFogCoverageTipLine(42)).toBe('Fog · 42%');
    expect(pauseFogCoverageTipLine(42)).toMatch(/^Fog \u00b7 /);
    expect(pauseFogCoverageTipLine(42)).toMatch(/%$/);
    expect(pauseFogCoverageTipLine(150)).toBe(
      t('pause.fogCoverageTip', { pct: 100 }),
    );
    expect(pauseFogCoverageTipLine(150)).toBe('Fog · 100%');
    expect(pauseFogCoverageTipLine(0)).toBe('Fog · 0%');
    expect(pauseFogCoverageTipLine(0)).toMatch(/^Fog \u00b7 /);

    const fog = pauseFogCoverageTipLine(42);
    expect(fog).not.toBe(pauseFogAgeTipLine(42_000));
    expect(pauseFogAgeTipLine(42_000)).toBe('Fog · 42s');
    expect(pauseFogAgeTipLine(42_000)).toMatch(/^Fog \u00b7 /);
    expect(fog).not.toBe(minimapFogAgeTipText(42_000));
    expect(minimapFogAgeTipText(42_000)).toBe('Fog age · 42s');
    expect(minimapFogAgeTipText(42_000)).toMatch(/^Fog age \u00b7 /);
    expect(fog).not.toBe(minimapVisionTipText(42));
    expect(minimapVisionTipText(42)).toBe('Vision · 42');
    expect(minimapVisionTipText(42)).toMatch(/^Vision \u00b7 /);
    expect(fog).not.toBe(pauseSelectionCountTipLine(42));
    expect(pauseSelectionCountTipLine(42)).toBe('Selected · 42');
    expect(pauseSelectionCountTipLine(42)).toMatch(/^Selected \u00b7 /);
    expect(fog).not.toMatch(/^Fog age \u00b7 /);
    expect(fog).not.toMatch(/^Vision \u00b7 /);
    expect(fog).not.toMatch(/^Selected \u00b7 /);
    expect(fog).not.toMatch(/s$/);

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(fog).toBe(minimapFogCoverageTipText(42));
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(t('pause.fogCoverageTip', { pct: 42 })).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
  });

  it('localizes Fog middot for pt-BR and es; stays distinct from Fog age / Vision / Selected', () => {
    setLocale('pt-BR');
    const pt = pauseFogCoverageTipLine(42);
    expect(pt).toBe(t('pause.fogCoverageTip', { pct: 42 }));
    expect(pt).toBe('Névoa · 42%');
    expect(pt).toMatch(/^Névoa \u00b7 /);
    expect(pt).toMatch(/%$/);
    expect(pt).not.toBe(pauseFogAgeTipLine(42_000));
    expect(pauseFogAgeTipLine(42_000)).toBe('Névoa · 42s');
    expect(pauseFogAgeTipLine(42_000)).toMatch(/^Névoa \u00b7 /);
    expect(pt).not.toBe(minimapFogAgeTipText(42_000));
    expect(minimapFogAgeTipText(42_000)).toBe('Idade névoa · 42s');
    expect(minimapFogAgeTipText(42_000)).toMatch(/^Idade névoa \u00b7 /);
    expect(pt).not.toBe(minimapVisionTipText(42));
    expect(minimapVisionTipText(42)).toBe('Visão · 42');
    expect(minimapVisionTipText(42)).toMatch(/^Visão \u00b7 /);
    expect(pt).not.toBe(pauseSelectionCountTipLine(42));
    expect(pauseSelectionCountTipLine(42)).toBe('Selecionados · 42');
    expect(pauseSelectionCountTipLine(42)).toMatch(/^Selecionados \u00b7 /);
    expect(pt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(pt).not.toMatch(/^Visão \u00b7 /);
    expect(pt).not.toMatch(/^Selecionados \u00b7 /);
    expect(pt).toBe(minimapFogCoverageTipText(42));
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );

    setLocale('es');
    const es = pauseFogCoverageTipLine(42);
    expect(es).toBe(t('pause.fogCoverageTip', { pct: 42 }));
    expect(es).toBe('Niebla · 42%');
    expect(es).toMatch(/^Niebla \u00b7 /);
    expect(es).toMatch(/%$/);
    expect(es).not.toBe(pauseFogAgeTipLine(42_000));
    expect(pauseFogAgeTipLine(42_000)).toBe('Niebla · 42s');
    expect(pauseFogAgeTipLine(42_000)).toMatch(/^Niebla \u00b7 /);
    expect(es).not.toBe(minimapFogAgeTipText(42_000));
    expect(minimapFogAgeTipText(42_000)).toBe('Edad niebla · 42s');
    expect(minimapFogAgeTipText(42_000)).toMatch(/^Edad niebla \u00b7 /);
    expect(es).not.toBe(minimapVisionTipText(42));
    expect(minimapVisionTipText(42)).toBe('Visión · 42');
    expect(minimapVisionTipText(42)).toMatch(/^Visión \u00b7 /);
    expect(es).not.toBe(pauseSelectionCountTipLine(42));
    expect(pauseSelectionCountTipLine(42)).toBe('Seleccionados · 42');
    expect(pauseSelectionCountTipLine(42)).toMatch(/^Seleccionados \u00b7 /);
    expect(es).not.toMatch(/^Edad niebla \u00b7 /);
    expect(es).not.toMatch(/^Visión \u00b7 /);
    expect(es).not.toMatch(/^Seleccionados \u00b7 /);
    expect(es).toBe(minimapFogCoverageTipText(42));
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    setLocale('en-GB');
  });
});
