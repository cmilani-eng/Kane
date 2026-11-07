import { describe, expect, it } from 'vitest';
import { createFogState } from '../../gameplay/battlefield/battlefieldFog';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import {
  fogExploredCoveragePct,
  minimapFogCoverageTipText,
} from './minimapFogCoverageTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { pauseFogAgeTipLine } from './pauseFogAgeTip';
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
  it('labels Fog · pct% with middot, distinct from Vision · / Fog age · / Selected · / Scout ·', () => {
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(minimapFogCoverageTipText(42)).toBe('Fog · 42%');
    expect(minimapFogCoverageTipText(42)).toMatch(/^Fog \u00b7 /);
    expect(minimapFogCoverageTipText(42)).toMatch(/^Fog \u00b7 42%$/);
    expect(minimapFogCoverageTipText(42)).toContain(' \u00b7 ');
    expect(minimapFogCoverageTipText(42)).not.toContain('  ·  ');
    expect(minimapFogCoverageTipText(42)).toMatch(/%$/);
    expect(minimapFogCoverageTipText(150)).toBe(
      t('hud.minimapFog', { pct: 100 }),
    );
    expect(minimapFogCoverageTipText(150)).toBe('Fog · 100%');
    expect(minimapFogCoverageTipText(150)).toMatch(/^Fog \u00b7 100%$/);
    expect(minimapFogCoverageTipText(0)).toBe('Fog · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Fog \u00b7 /);
    expect(minimapFogCoverageTipText(0)).toContain(' \u00b7 ');
    expect(minimapFogCoverageTipText(0)).not.toContain('  ·  ');

    const fog = minimapFogCoverageTipText(42);
    expect(fog).not.toBe(minimapVisionTipText(42));
    expect(minimapVisionTipText(42)).toBe('Vision · 42');
    expect(minimapVisionTipText(42)).toMatch(/^Vision \u00b7 /);
    expect(fog).not.toBe(minimapFogAgeTipText(42_000));
    expect(minimapFogAgeTipText(42_000)).toBe('Fog age · 42s');
    expect(minimapFogAgeTipText(42_000)).toMatch(/^Fog age \u00b7 /);
    expect(fog).not.toBe(pauseFogAgeTipLine(42_000));
    expect(pauseFogAgeTipLine(42_000)).toBe('Fog · 42s');
    expect(pauseFogAgeTipLine(42_000)).toMatch(/^Fog \u00b7 /);
    expect(fog).not.toBe(minimapSelectedCountTipText(42));
    expect(minimapSelectedCountTipText(42)).toBe('Selected · 42');
    expect(minimapSelectedCountTipText(42)).toMatch(/^Selected \u00b7 /);
    expect(fog).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Scout · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Scout \u00b7 /);
    expect(fog).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Scout · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Scout \u00b7 NW \u00b7 0s$/,
    );

    expect(fog).not.toMatch(/^Vision \u00b7 /);
    expect(fog).not.toMatch(/^Fog age \u00b7 /);
    expect(fog).not.toMatch(/^Selected \u00b7 /);
    expect(fog).not.toMatch(/^Scout \u00b7 /);
    // Pause Fog · ns shares the Fog · prefix but ends in s, not %.
    expect(fog).toMatch(/%$/);
    expect(pauseFogAgeTipLine(42_000)).toMatch(/s$/);
    expect(fog).not.toBe(pauseFogAgeTipLine(42_000));

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(fog).toBe(pauseFogCoverageTipLine(42));
    expect(pauseFogCoverageTipLine(42)).toBe(
      t('pause.fogCoverageTip', { pct: 42 }),
    );
    expect(pauseFogCoverageTipLine(42)).toBe('Fog · 42%');
    expect(pauseFogCoverageTipLine(42)).toMatch(/^Fog \u00b7 /);
    expect(t('hud.minimapFog', { pct: 1 })).toBe(
      t('pause.fogCoverageTip', { pct: 1 }),
    );
  });

  it('localizes Fog middot for pt-BR and es; stays distinct from Vision / Fog age / Selected / Scout', () => {
    setLocale('pt-BR');
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(minimapFogCoverageTipText(42)).toBe('Névoa · 42%');
    expect(minimapFogCoverageTipText(42)).toMatch(/^Névoa \u00b7 /);
    expect(minimapFogCoverageTipText(42)).toMatch(/^Névoa \u00b7 42%$/);
    expect(minimapFogCoverageTipText(42)).toContain(' \u00b7 ');
    expect(minimapFogCoverageTipText(42)).not.toContain('  ·  ');
    expect(minimapFogCoverageTipText(42)).toMatch(/%$/);

    const fogPt = minimapFogCoverageTipText(42);
    expect(fogPt).not.toBe(minimapVisionTipText(42));
    expect(minimapVisionTipText(42)).toBe('Visão · 42');
    expect(minimapVisionTipText(42)).toMatch(/^Visão \u00b7 /);
    expect(fogPt).not.toBe(minimapFogAgeTipText(42_000));
    expect(minimapFogAgeTipText(42_000)).toBe('Idade névoa · 42s');
    expect(minimapFogAgeTipText(42_000)).toMatch(/^Idade névoa \u00b7 /);
    expect(fogPt).not.toBe(pauseFogAgeTipLine(42_000));
    expect(pauseFogAgeTipLine(42_000)).toBe('Névoa · 42s');
    expect(pauseFogAgeTipLine(42_000)).toMatch(/^Névoa \u00b7 /);
    expect(fogPt).not.toBe(minimapSelectedCountTipText(42));
    expect(minimapSelectedCountTipText(42)).toBe('Selecionados · 42');
    expect(minimapSelectedCountTipText(42)).toMatch(/^Selecionados \u00b7 /);
    expect(fogPt).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Revela · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Revela \u00b7 /);
    expect(fogPt).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Revela · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Revela \u00b7 NW \u00b7 0s$/,
    );
    expect(fogPt).not.toMatch(/^Visão \u00b7 /);
    expect(fogPt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(fogPt).not.toMatch(/^Selecionados \u00b7 /);
    expect(fogPt).not.toMatch(/^Revela \u00b7 /);
    expect(fogPt).toBe(pauseFogCoverageTipLine(42));
    expect(pauseFogCoverageTipLine(42)).toMatch(/^Névoa \u00b7 /);

    setLocale('es');
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(minimapFogCoverageTipText(42)).toBe('Niebla · 42%');
    expect(minimapFogCoverageTipText(42)).toMatch(/^Niebla \u00b7 /);
    expect(minimapFogCoverageTipText(42)).toMatch(/^Niebla \u00b7 42%$/);
    expect(minimapFogCoverageTipText(42)).toContain(' \u00b7 ');
    expect(minimapFogCoverageTipText(42)).not.toContain('  ·  ');
    expect(minimapFogCoverageTipText(42)).toMatch(/%$/);

    const fogEs = minimapFogCoverageTipText(42);
    expect(fogEs).not.toBe(minimapVisionTipText(42));
    expect(minimapVisionTipText(42)).toBe('Visión · 42');
    expect(minimapVisionTipText(42)).toMatch(/^Visión \u00b7 /);
    expect(fogEs).not.toBe(minimapFogAgeTipText(42_000));
    expect(minimapFogAgeTipText(42_000)).toBe('Edad niebla · 42s');
    expect(minimapFogAgeTipText(42_000)).toMatch(/^Edad niebla \u00b7 /);
    expect(fogEs).not.toBe(pauseFogAgeTipLine(42_000));
    expect(pauseFogAgeTipLine(42_000)).toBe('Niebla · 42s');
    expect(pauseFogAgeTipLine(42_000)).toMatch(/^Niebla \u00b7 /);
    expect(fogEs).not.toBe(minimapSelectedCountTipText(42));
    expect(minimapSelectedCountTipText(42)).toBe('Seleccionados · 42');
    expect(minimapSelectedCountTipText(42)).toMatch(/^Seleccionados \u00b7 /);
    expect(fogEs).not.toBe(minimapScoutPulseLabelText('SE'));
    expect(minimapScoutPulseLabelText('SE')).toBe('Explora · SE');
    expect(minimapScoutPulseLabelText('SE')).toMatch(/^Explora \u00b7 /);
    expect(fogEs).not.toBe(
      minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toBe(
      'Explora · SE · 0s',
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Explora \u00b7 SE \u00b7 0s$/,
    );
    expect(fogEs).not.toMatch(/^Visión \u00b7 /);
    expect(fogEs).not.toMatch(/^Edad niebla \u00b7 /);
    expect(fogEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(fogEs).not.toMatch(/^Explora \u00b7 /);
    expect(fogEs).toBe(pauseFogCoverageTipLine(42));
    expect(pauseFogCoverageTipLine(42)).toMatch(/^Niebla \u00b7 /);
    setLocale('en-GB');
  });
});
