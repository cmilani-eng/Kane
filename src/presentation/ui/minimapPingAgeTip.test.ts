import { describe, expect, it } from 'vitest';
import { ATTENTION_PING_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';
import { t } from '../../i18n';
import { minimapPingAgeTip, pingAgeSec } from './minimapPingAgeTip';
import { minimapPingSectorTipText } from './minimapPingSectorTip';

describe('minimapPingAgeTip', () => {
  it('counts whole seconds since the ping armed', () => {
    expect(pingAgeSec(ATTENTION_PING_SECTOR_HINT_MS)).toBe(0);
    expect(pingAgeSec(ATTENTION_PING_SECTOR_HINT_MS - 999)).toBe(0);
    expect(pingAgeSec(ATTENTION_PING_SECTOR_HINT_MS - 1000)).toBe(1);
    expect(pingAgeSec(0)).toBe(Math.floor(ATTENTION_PING_SECTOR_HINT_MS / 1000));
  });

  it('labels Mark · sector · ns distinct from the sector-only mark', () => {
    const tip = minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS);
    expect(tip).toBe(t('hud.pingAge', { sector: 'NW', sec: 0 }));
    expect(tip).toContain('NW');
    expect(tip).toMatch(/0s|0\s*s/);
    expect(tip).not.toBe(minimapPingSectorTipText('NW'));
  });
});
