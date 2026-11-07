import { describe, expect, it } from 'vitest';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { setLocale, t } from '../../i18n';
import { minimapCameraSectorTipText } from './minimapCameraSectorTip';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import {
  minimapScoutPulseLabelAlpha,
  minimapScoutPulseLabelText,
} from './minimapScoutPulseLabel';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';

describe('minimapScoutPulseLabel', () => {
  it('labels Scout · sector with middot, distinct from age / Fog age · / Fog · % / Cam ·', () => {
    const tip = minimapScoutPulseLabelText('NW');
    expect(tip).toBe(t('hud.minimapScoutPulse', { sector: 'NW' }));
    expect(tip).toBe('Scout · NW');
    expect(tip).toMatch(/^Scout \u00b7 /);
    expect(tip).toMatch(/^Scout \u00b7 NW$/);
    expect(tip).toContain('NW');
    expect(minimapScoutPulseLabelText('SE')).toBe('Scout · SE');
    expect(minimapScoutPulseLabelText('SE')).toMatch(/^Scout \u00b7 SE$/);
    expect(minimapScoutPulseLabelText('C')).toBe('Scout · C');
    expect(minimapScoutPulseLabelText('C')).toMatch(/^Scout \u00b7 /);

    expect(tip).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Scout · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Scout \u00b7 NW \u00b7 0s$/,
    );
    expect(tip).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Fog age · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toBe(minimapFogCoverageTipText(0));
    expect(minimapFogCoverageTipText(0)).toBe('Fog · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Fog \u00b7 /);
    expect(tip).not.toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe('Cam · NW');
    expect(minimapCameraSectorTipText('NW')).toMatch(/^Cam \u00b7 /);
    expect(tip).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe('Cam · NW');
    expect(pauseCameraSectorTipLine('NW')).toMatch(/^Cam \u00b7 /);

    expect(tip).not.toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toMatch(/^Fog \u00b7 /);
    expect(tip).not.toMatch(/^Cam \u00b7 /);
    // Sector-only Scout · lacks the trailing · ns age of the reveal tip.
    expect(tip).not.toMatch(/ \u00b7 \d+s$/);
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      / \u00b7 \d+s$/,
    );
  });

  it('localizes Scout · sector middot for pt-BR and es; stays distinct from age / Fog age / Fog · % / Cam', () => {
    setLocale('pt-BR');
    expect(minimapScoutPulseLabelText('NW')).toBe(
      t('hud.minimapScoutPulse', { sector: 'NW' }),
    );
    expect(minimapScoutPulseLabelText('NW')).toBe('Revela · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Revela \u00b7 /);
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Revela \u00b7 NW$/);

    const tipPt = minimapScoutPulseLabelText('NW');
    expect(tipPt).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Revela · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Revela \u00b7 NW \u00b7 0s$/,
    );
    expect(tipPt).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Idade névoa · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Idade névoa \u00b7 /);
    expect(tipPt).not.toBe(minimapFogCoverageTipText(0));
    expect(minimapFogCoverageTipText(0)).toBe('Névoa · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Névoa \u00b7 /);
    expect(tipPt).not.toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe('Câm · NW');
    expect(minimapCameraSectorTipText('NW')).toMatch(/^Câm \u00b7 /);
    expect(tipPt).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe('Câm · NW');
    expect(tipPt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(tipPt).not.toMatch(/^Névoa \u00b7 /);
    expect(tipPt).not.toMatch(/^Câm \u00b7 /);
    expect(tipPt).not.toMatch(/ \u00b7 \d+s$/);

    setLocale('es');
    expect(minimapScoutPulseLabelText('SE')).toBe(
      t('hud.minimapScoutPulse', { sector: 'SE' }),
    );
    expect(minimapScoutPulseLabelText('SE')).toBe('Explora · SE');
    expect(minimapScoutPulseLabelText('SE')).toMatch(/^Explora \u00b7 /);
    expect(minimapScoutPulseLabelText('SE')).toMatch(/^Explora \u00b7 SE$/);

    const tipEs = minimapScoutPulseLabelText('SE');
    expect(tipEs).not.toBe(
      minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toBe(
      'Explora · SE · 0s',
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Explora \u00b7 SE \u00b7 0s$/,
    );
    expect(tipEs).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Edad niebla · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Edad niebla \u00b7 /);
    expect(tipEs).not.toBe(minimapFogCoverageTipText(0));
    expect(minimapFogCoverageTipText(0)).toBe('Niebla · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Niebla \u00b7 /);
    expect(tipEs).not.toBe(minimapCameraSectorTipText('SE'));
    expect(minimapCameraSectorTipText('SE')).toBe('Cám · SE');
    expect(minimapCameraSectorTipText('SE')).toMatch(/^Cám \u00b7 /);
    expect(tipEs).not.toBe(pauseCameraSectorTipLine('SE'));
    expect(pauseCameraSectorTipLine('SE')).toBe('Cám · SE');
    expect(tipEs).not.toMatch(/^Edad niebla \u00b7 /);
    expect(tipEs).not.toMatch(/^Niebla \u00b7 /);
    expect(tipEs).not.toMatch(/^Cám \u00b7 /);
    expect(tipEs).not.toMatch(/ \u00b7 \d+s$/);
    setLocale('en-GB');
  });

  it('fades with remaining hint life', () => {
    expect(minimapScoutPulseLabelAlpha(SCOUT_SECTOR_HINT_MS)).toBeGreaterThan(
      minimapScoutPulseLabelAlpha(100),
    );
    expect(minimapScoutPulseLabelAlpha(0)).toBe(0);
  });
});
