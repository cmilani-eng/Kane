import { describe, expect, it } from 'vitest';
import { createFogState } from '../../gameplay/battlefield/battlefieldFog';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import {
  fogExploredCoveragePct,
  minimapFogCoverageTipText,
} from './minimapFogCoverageTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { pauseFogCoverageTipLine } from './pauseFogCoverageTip';

describe('fogExploredCoveragePct', () => {
  it('is 0 on a fresh fog grid and 100 when fully explored', () => {
    const fog = createFogState();
    expect(fogExploredCoveragePct(fog)).toBe(0);
    fog.explored.fill(1);
    expect(fogExploredCoveragePct(fog)).toBe(100);
  });

  it('rounds explored / total as a whole percent', () => {
    const fog = createFogState();
    const quarter = Math.floor(fog.explored.length / 4);
    for (let i = 0; i < quarter; i++) fog.explored[i] = 1;
    expect(fogExploredCoveragePct(fog)).toBe(
      Math.round((100 * quarter) / fog.explored.length),
    );
  });
});

describe('minimapFogCoverageTipText', () => {
  it('labels Fog · pct% with middot, distinct from Vision · / Fog age · / Selected ·', () => {
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(minimapFogCoverageTipText(42)).toBe('Fog · 42%');
    expect(minimapFogCoverageTipText(42)).toMatch(/^Fog \u00b7 /);
    expect(minimapFogCoverageTipText(42)).toMatch(/%$/);
    expect(minimapFogCoverageTipText(150)).toBe(
      t('hud.minimapFog', { pct: 100 }),
    );
    expect(minimapFogCoverageTipText(150)).toBe('Fog · 100%');
    expect(minimapFogCoverageTipText(0)).toBe('Fog · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Fog \u00b7 /);

    const fog = minimapFogCoverageTipText(42);
    expect(fog).not.toBe(minimapVisionTipText(42));
    expect(fog).not.toBe(minimapFogAgeTipText(42_000));
    expect(fog).not.toBe(minimapSelectedCountTipText(42));
    expect(fog).not.toMatch(/^Vision \u00b7 /);
    expect(fog).not.toMatch(/^Fog age \u00b7 /);
    expect(fog).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(fog).toBe(pauseFogCoverageTipLine(42));
    expect(pauseFogCoverageTipLine(42)).toBe(
      t('pause.fogCoverageTip', { pct: 42 }),
    );
  });

  it('localizes Fog middot for pt-BR and es; stays distinct from Vision / Fog age / Selected', () => {
    setLocale('pt-BR');
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(minimapFogCoverageTipText(42)).toBe('Névoa · 42%');
    expect(minimapFogCoverageTipText(42)).toMatch(/^Névoa \u00b7 /);
    expect(minimapFogCoverageTipText(42)).toMatch(/%$/);

    const fogPt = minimapFogCoverageTipText(42);
    expect(fogPt).not.toBe(minimapVisionTipText(42));
    expect(fogPt).not.toBe(minimapFogAgeTipText(42_000));
    expect(fogPt).not.toBe(minimapSelectedCountTipText(42));
    expect(fogPt).not.toMatch(/^Visão \u00b7 /);
    expect(fogPt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(fogPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(fogPt).toBe(pauseFogCoverageTipLine(42));

    setLocale('es');
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(minimapFogCoverageTipText(42)).toBe('Niebla · 42%');
    expect(minimapFogCoverageTipText(42)).toMatch(/^Niebla \u00b7 /);
    expect(minimapFogCoverageTipText(42)).toMatch(/%$/);

    const fogEs = minimapFogCoverageTipText(42);
    expect(fogEs).not.toBe(minimapVisionTipText(42));
    expect(fogEs).not.toBe(minimapFogAgeTipText(42_000));
    expect(fogEs).not.toBe(minimapSelectedCountTipText(42));
    expect(fogEs).not.toMatch(/^Visión \u00b7 /);
    expect(fogEs).not.toMatch(/^Edad niebla \u00b7 /);
    expect(fogEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(fogEs).toBe(pauseFogCoverageTipLine(42));
    setLocale('en-GB');
  });
});
