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

  it('labels Scout · sector · ns with middot, distinct from fog age / coverage / pause cam / sector-only', () => {
    const tip = minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS);
    expect(tip).toBe(t('hud.fogRevealAge', { sector: 'NW', sec: 0 }));
    expect(tip).toBe('Scout · NW · 0s');
    expect(tip).toMatch(/^Scout \u00b7 /);
    expect(tip).toMatch(/ · 0s$/);
    expect(tip).toContain('NW');
    expect(tip).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Scout · NW');
    expect(tip).not.toBe(minimapFogAgeTipText(0));
    expect(tip).not.toBe(minimapFogCoverageTipText(0));
    expect(tip).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );
  });

  it('localizes Scout · sector · ns middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toBe(
      t('hud.fogRevealAge', { sector: 'SE', sec: 0 }),
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toBe(
      'Revela · SE · 0s',
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Revela \u00b7 /,
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).not.toBe(
      minimapScoutPulseLabelText('SE'),
    );
    expect(minimapScoutPulseLabelText('SE')).toBe('Revela · SE');
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).not.toBe(
      minimapFogAgeTipText(0),
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).not.toBe(
      pauseCameraSectorTipLine('SE'),
    );

    setLocale('es');
    expect(minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS)).toBe(
      t('hud.fogRevealAge', { sector: 'C', sec: 0 }),
    );
    expect(minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS)).toBe(
      'Explora · C · 0s',
    );
    expect(minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Explora \u00b7 /,
    );
    expect(minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS)).not.toBe(
      minimapScoutPulseLabelText('C'),
    );
    expect(minimapScoutPulseLabelText('C')).toBe('Explora · C');
    expect(minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS)).not.toBe(
      minimapFogAgeTipText(0),
    );
    expect(minimapFogRevealAgeTip('C', SCOUT_SECTOR_HINT_MS)).not.toBe(
      pauseCameraSectorTipLine('C'),
    );
    setLocale('en-GB');
  });
});
