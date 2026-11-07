import { describe, expect, it } from 'vitest';
import { ATTENTION_PING_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import { minimapPingAgeTip, pingAgeSec } from './minimapPingAgeTip';
import { minimapPingSectorTipText } from './minimapPingSectorTip';

describe('minimapPingAgeTip', () => {
  it('counts whole seconds since the ping armed', () => {
    expect(pingAgeSec(ATTENTION_PING_SECTOR_HINT_MS)).toBe(0);
    expect(pingAgeSec(ATTENTION_PING_SECTOR_HINT_MS - 999)).toBe(0);
    expect(pingAgeSec(ATTENTION_PING_SECTOR_HINT_MS - 1000)).toBe(1);
    expect(pingAgeSec(0)).toBe(Math.floor(ATTENTION_PING_SECTOR_HINT_MS / 1000));
  });

  it('labels Mark · sector · ns with middot, distinct from sector-only / Fog age · / Scout ·', () => {
    const tip = minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS);
    expect(tip).toBe(t('hud.pingAge', { sector: 'NW', sec: 0 }));
    expect(tip).toBe('Mark · NW · 0s');
    expect(tip).toMatch(/^Mark \u00b7 /);
    expect(tip).toMatch(/ \u00b7 0s$/);
    expect(tip).toContain('NW');
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).toBe(
      'Mark · SE · 1s',
    );
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).toMatch(
      /^Mark \u00b7 SE \u00b7 1s$/,
    );
    expect(tip).not.toBe(minimapPingSectorTipText('NW'));
    expect(minimapPingSectorTipText('NW')).toBe('Mark · NW');
    expect(tip).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Fog age · 0s');
    expect(tip).not.toBe(minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS));
  });

  it('localizes Mark · sector · ns middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      t('hud.pingAge', { sector: 'NW', sec: 0 }),
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Marca · NW · 0s',
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toMatch(
      /^Marca \u00b7 /,
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toMatch(
      / \u00b7 0s$/,
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).not.toBe(
      minimapPingSectorTipText('NW'),
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).not.toBe(
      minimapFogAgeTipText(0),
    );
    expect(minimapFogAgeTipText(0)).toBe('Idade névoa · 0s');
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).not.toBe(
      minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS),
    );

    setLocale('es');
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).toBe(
      t('hud.pingAge', { sector: 'SE', sec: 1 }),
    );
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).toBe(
      'Marca · SE · 1s',
    );
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).toMatch(
      /^Marca \u00b7 SE \u00b7 1s$/,
    );
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).not.toBe(
      minimapPingSectorTipText('SE'),
    );
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).not.toBe(
      minimapFogAgeTipText(1000),
    );
    expect(minimapFogAgeTipText(1000)).toBe('Edad niebla · 1s');
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).not.toBe(
      minimapFogRevealAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000),
    );
    setLocale('en-GB');
  });
});
