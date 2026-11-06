import { describe, expect, it } from 'vitest';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { t } from '../../i18n';
import {
  minimapScoutPulseLabelAlpha,
  minimapScoutPulseLabelText,
} from './minimapScoutPulseLabel';

describe('minimapScoutPulseLabel', () => {
  it('labels the scouted sector for the minimap', () => {
    expect(minimapScoutPulseLabelText('NW')).toBe(
      t('hud.minimapScoutPulse', { sector: 'NW' }),
    );
    expect(minimapScoutPulseLabelText('SE')).toContain('SE');
  });

  it('fades with remaining hint life', () => {
    expect(minimapScoutPulseLabelAlpha(SCOUT_SECTOR_HINT_MS)).toBeGreaterThan(
      minimapScoutPulseLabelAlpha(100),
    );
    expect(minimapScoutPulseLabelAlpha(0)).toBe(0);
  });
});
