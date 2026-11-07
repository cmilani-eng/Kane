import { describe, expect, it } from 'vitest';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { t } from '../../i18n';
import {
  fogRevealAgeSec,
  minimapFogRevealAgeTip,
} from './minimapFogRevealAgeTip';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';

describe('minimapFogRevealAgeTip', () => {
  it('counts whole seconds since the reveal armed', () => {
    expect(fogRevealAgeSec(SCOUT_SECTOR_HINT_MS)).toBe(0);
    expect(fogRevealAgeSec(SCOUT_SECTOR_HINT_MS - 999)).toBe(0);
    expect(fogRevealAgeSec(SCOUT_SECTOR_HINT_MS - 1000)).toBe(1);
    expect(fogRevealAgeSec(0)).toBe(Math.floor(SCOUT_SECTOR_HINT_MS / 1000));
  });

  it('labels Scout sector · ns distinct from the sector-only mark', () => {
    const tip = minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS);
    expect(tip).toBe(t('hud.fogRevealAge', { sector: 'NW', sec: 0 }));
    expect(tip).toContain('NW');
    expect(tip).toMatch(/0s|0\s*s/);
    expect(tip).not.toBe(minimapScoutPulseLabelText('NW'));
  });
});
