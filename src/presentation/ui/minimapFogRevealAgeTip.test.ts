import { describe, expect, it } from 'vitest';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { setLocale, t } from '../../i18n';
import {
  fogRevealAgeSec,
  minimapFogRevealAgeTip,
} from './minimapFogRevealAgeTip';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';

describe('minimapFogRevealAgeTip', () => {
  it('counts whole seconds since the reveal armed', () => {
    expect(fogRevealAgeSec(SCOUT_SECTOR_HINT_MS)).toBe(0);
    expect(fogRevealAgeSec(SCOUT_SECTOR_HINT_MS - 999)).toBe(0);
    expect(fogRevealAgeSec(SCOUT_SECTOR_HINT_MS - 1000)).toBe(1);
    expect(fogRevealAgeSec(0)).toBe(Math.floor(SCOUT_SECTOR_HINT_MS / 1000));
  });

  it('labels Scout · sector · ns with middot, distinct from Scout · / Fog age · / Fog · % / Cam ·', () => {
    const tip = minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS);
    expect(tip).toBe(t('hud.fogRevealAge', { sector: 'NW', sec: 0 }));
    expect(tip).toBe('Scout · NW · 0s');
    expect(tip).toMatch(/^Scout \u00b7 /);
    expect(tip).toMatch(/ \u00b7 0s$/);
    expect(tip).toMatch(/^Scout \u00b7 NW \u00b7 0s$/);
    expect(tip).toContain('NW');
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS - 1000)).toBe(
      'Scout · SE · 1s',
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS - 1000)).toMatch(
      /^Scout \u00b7 SE \u00b7 1s$/,
    );

    expect(tip).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Scout · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Scout \u00b7 /);
    expect(tip).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Fog age · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toBe(minimapFogCoverageTipText(0));
    expect(minimapFogCoverageTipText(0)).toBe('Fog · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Fog \u00b7 /);
    expect(tip).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe('Cam · NW');
    expect(pauseCameraSectorTipLine('NW')).toMatch(/^Cam \u00b7 /);
    expect(pauseCameraSectorTipLine('NW')).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );

    expect(tip).not.toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toMatch(/^Fog \u00b7 /);
    expect(tip).not.toMatch(/^Cam \u00b7 /);
    // Sector-only Scout · lacks the trailing · ns age.
    expect(minimapScoutPulseLabelText('NW')).not.toMatch(/ \u00b7 \d+s$/);
    expect(tip).toMatch(/ \u00b7 \d+s$/);
  });

  it('localizes Scout · sector · ns middot for pt-BR and es; stays distinct from Scout / Fog age / Fog · % / Cam', () => {
    setLocale('pt-BR');
    const tipPt = minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS);
    expect(tipPt).toBe(t('hud.fogRevealAge', { sector: 'SE', sec: 0 }));
    expect(tipPt).toBe('Revela · SE · 0s');
    expect(tipPt).toMatch(/^Revela \u00b7 /);
    expect(tipPt).toMatch(/ \u00b7 0s$/);
    expect(tipPt).toMatch(/^Revela \u00b7 SE \u00b7 0s$/);

    expect(tipPt).not.toBe(minimapScoutPulseLabelText('SE'));
    expect(minimapScoutPulseLabelText('SE')).toBe('Revela · SE');
    expect(minimapScoutPulseLabelText('SE')).toMatch(/^Revela \u00b7 /);
    expect(tipPt).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Idade névoa · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Idade névoa \u00b7 /);
    expect(tipPt).not.toBe(minimapFogCoverageTipText(0));
    expect(minimapFogCoverageTipText(0)).toBe('Névoa · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Névoa \u00b7 /);
    expect(tipPt).not.toBe(pauseCameraSectorTipLine('SE'));
    expect(pauseCameraSectorTipLine('SE')).toBe('Câm · SE');
    expect(pauseCameraSectorTipLine('SE')).toMatch(/^Câm \u00b7 /);

    expect(tipPt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(tipPt).not.toMatch(/^Névoa \u00b7 /);
    expect(tipPt).not.toMatch(/^Câm \u00b7 /);
    expect(minimapScoutPulseLabelText('SE')).not.toMatch(/ \u00b7 \d+s$/);
    expect(tipPt).toMatch(/ \u00b7 \d+s$/);

    setLocale('es');
    const tipEs = minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS);
    expect(tipEs).toBe(t('hud.fogRevealAge', { sector: 'C', sec: 0 }));
    expect(tipEs).toBe('Explora · C · 0s');
    expect(tipEs).toMatch(/^Explora \u00b7 /);
    expect(tipEs).toMatch(/ \u00b7 0s$/);
    expect(tipEs).toMatch(/^Explora \u00b7 C \u00b7 0s$/);
    expect(
      minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS - 1000),
    ).toBe('Explora · C · 1s');
    expect(
      minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS - 1000),
    ).toMatch(/^Explora \u00b7 C \u00b7 1s$/);

    expect(tipEs).not.toBe(minimapScoutPulseLabelText('C'));
    expect(minimapScoutPulseLabelText('C')).toBe('Explora · C');
    expect(minimapScoutPulseLabelText('C')).toMatch(/^Explora \u00b7 /);
    expect(tipEs).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Edad niebla · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Edad niebla \u00b7 /);
    expect(tipEs).not.toBe(minimapFogCoverageTipText(0));
    expect(minimapFogCoverageTipText(0)).toBe('Niebla · 0%');
    expect(minimapFogCoverageTipText(0)).toMatch(/^Niebla \u00b7 /);
    expect(tipEs).not.toBe(pauseCameraSectorTipLine('C'));
    expect(pauseCameraSectorTipLine('C')).toBe('Cám · C');
    expect(pauseCameraSectorTipLine('C')).toMatch(/^Cám \u00b7 /);

    expect(tipEs).not.toMatch(/^Edad niebla \u00b7 /);
    expect(tipEs).not.toMatch(/^Niebla \u00b7 /);
    expect(tipEs).not.toMatch(/^Cám \u00b7 /);
    expect(minimapScoutPulseLabelText('C')).not.toMatch(/ \u00b7 \d+s$/);
    expect(tipEs).toMatch(/ \u00b7 \d+s$/);
    setLocale('en-GB');
  });
});
