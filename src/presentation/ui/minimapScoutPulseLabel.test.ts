import { describe, expect, it } from 'vitest';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import {
  minimapScoutPulseLabelAlpha,
  minimapScoutPulseLabelText,
} from './minimapScoutPulseLabel';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';

describe('minimapScoutPulseLabel', () => {
  it('labels Scout · sector with middot, distinct from age / fog / pause cam', () => {
    expect(minimapScoutPulseLabelText('NW')).toBe(
      t('hud.minimapScoutPulse', { sector: 'NW' }),
    );
    expect(minimapScoutPulseLabelText('NW')).toBe('Scout · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Scout \u00b7 /);
    expect(minimapScoutPulseLabelText('SE')).toContain('SE');
    expect(minimapScoutPulseLabelText('NW')).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapScoutPulseLabelText('NW')).not.toBe(minimapFogAgeTipText(0));
    expect(minimapScoutPulseLabelText('NW')).not.toBe(
      minimapFogCoverageTipText(0),
    );
    expect(minimapScoutPulseLabelText('NW')).not.toBe(
      pauseCameraSectorTipLine('NW'),
    );
  });

  it('localizes Scout · sector middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(minimapScoutPulseLabelText('NW')).toBe(
      t('hud.minimapScoutPulse', { sector: 'NW' }),
    );
    expect(minimapScoutPulseLabelText('NW')).toBe('Revela · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Revela \u00b7 /);
    expect(minimapScoutPulseLabelText('NW')).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapScoutPulseLabelText('NW')).not.toBe(
      pauseCameraSectorTipLine('NW'),
    );

    setLocale('es');
    expect(minimapScoutPulseLabelText('SE')).toBe(
      t('hud.minimapScoutPulse', { sector: 'SE' }),
    );
    expect(minimapScoutPulseLabelText('SE')).toBe('Explora · SE');
    expect(minimapScoutPulseLabelText('SE')).toMatch(/^Explora \u00b7 /);
    expect(minimapScoutPulseLabelText('SE')).not.toBe(
      minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapScoutPulseLabelText('SE')).not.toBe(
      pauseCameraSectorTipLine('SE'),
    );
    setLocale('en-GB');
  });

  it('fades with remaining hint life', () => {
    expect(minimapScoutPulseLabelAlpha(SCOUT_SECTOR_HINT_MS)).toBeGreaterThan(
      minimapScoutPulseLabelAlpha(100),
    );
    expect(minimapScoutPulseLabelAlpha(0)).toBe(0);
  });
});
