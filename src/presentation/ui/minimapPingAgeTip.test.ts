import { describe, expect, it } from 'vitest';
import { ATTENTION_PING_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';
import { setLocale, t } from '../../i18n';
import { minimapCameraSectorTipText } from './minimapCameraSectorTip';
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

  it('labels Mark · sector · ns with middot, distinct from Mark · / Fog age · / Scout · / Cam ·', () => {
    const tip = minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS);
    expect(tip).toBe(t('hud.pingAge', { sector: 'NW', sec: 0 }));
    expect(tip).toBe('Mark · NW · 0s');
    expect(tip).toMatch(/^Mark \u00b7 /);
    expect(tip).toMatch(/ \u00b7 0s$/);
    expect(tip).toMatch(/^Mark \u00b7 NW \u00b7 0s$/);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).not.toContain('  ·  ');
    expect(tip).toContain('NW');
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).toBe(
      'Mark · SE · 1s',
    );
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000)).toMatch(
      /^Mark \u00b7 SE \u00b7 1s$/,
    );
    expect(minimapPingAgeTip('C', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Mark · C · 0s',
    );
    expect(minimapPingAgeTip('C', ATTENTION_PING_SECTOR_HINT_MS)).toMatch(
      /^Mark \u00b7 C \u00b7 0s$/,
    );

    expect(tip).not.toBe(minimapPingSectorTipText('NW'));
    expect(minimapPingSectorTipText('NW')).toBe('Mark · NW');
    expect(minimapPingSectorTipText('NW')).toMatch(/^Mark \u00b7 /);
    expect(minimapPingSectorTipText('NW')).toMatch(/^Mark \u00b7 NW$/);
    expect(tip).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Fog age · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toBe(
      minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Scout · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toMatch(
      /^Scout \u00b7 NW \u00b7 0s$/,
    );
    expect(tip).not.toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe('Cam · NW');
    expect(minimapCameraSectorTipText('NW')).toMatch(/^Cam \u00b7 /);

    expect(tip).not.toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toMatch(/^Scout \u00b7 /);
    expect(tip).not.toMatch(/^Cam \u00b7 /);
    // Sector-only Mark · lacks the trailing · ns age of the ping age tip.
    expect(minimapPingSectorTipText('NW')).not.toMatch(/ \u00b7 \d+s$/);
    expect(tip).toMatch(/ \u00b7 \d+s$/);
  });

  it('localizes Mark · sector · ns middot for pt-BR and es; stays distinct from Mark · / Fog age / Scout · / Cam', () => {
    setLocale('pt-BR');
    const tipPt = minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS);
    expect(tipPt).toBe(t('hud.pingAge', { sector: 'NW', sec: 0 }));
    expect(tipPt).toBe('Marca · NW · 0s');
    expect(tipPt).toMatch(/^Marca \u00b7 /);
    expect(tipPt).toMatch(/ \u00b7 0s$/);
    expect(tipPt).toMatch(/^Marca \u00b7 NW \u00b7 0s$/);
    expect(tipPt).toContain(' \u00b7 ');
    expect(tipPt).not.toContain('  ·  ');

    expect(tipPt).not.toBe(minimapPingSectorTipText('NW'));
    expect(minimapPingSectorTipText('NW')).toBe('Marca · NW');
    expect(minimapPingSectorTipText('NW')).toMatch(/^Marca \u00b7 NW$/);
    expect(tipPt).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Idade névoa · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Idade névoa \u00b7 /);
    expect(tipPt).not.toBe(
      minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Revela · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toMatch(
      /^Revela \u00b7 NW \u00b7 0s$/,
    );
    expect(tipPt).not.toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe('Câm · NW');
    expect(minimapCameraSectorTipText('NW')).toMatch(/^Câm \u00b7 /);

    expect(tipPt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(tipPt).not.toMatch(/^Revela \u00b7 /);
    expect(tipPt).not.toMatch(/^Câm \u00b7 /);
    expect(minimapPingSectorTipText('NW')).not.toMatch(/ \u00b7 \d+s$/);
    expect(tipPt).toMatch(/ \u00b7 \d+s$/);

    setLocale('es');
    const tipEs = minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS - 1000);
    expect(tipEs).toBe(t('hud.pingAge', { sector: 'SE', sec: 1 }));
    expect(tipEs).toBe('Marca · SE · 1s');
    expect(tipEs).toMatch(/^Marca \u00b7 /);
    expect(tipEs).toMatch(/ \u00b7 1s$/);
    expect(tipEs).toMatch(/^Marca \u00b7 SE \u00b7 1s$/);
    expect(tipEs).toContain(' \u00b7 ');
    expect(tipEs).not.toContain('  ·  ');

    expect(tipEs).not.toBe(minimapPingSectorTipText('SE'));
    expect(minimapPingSectorTipText('SE')).toBe('Marca · SE');
    expect(minimapPingSectorTipText('SE')).toMatch(/^Marca \u00b7 SE$/);
    expect(tipEs).not.toBe(minimapFogAgeTipText(1000));
    expect(minimapFogAgeTipText(1000)).toBe('Edad niebla · 1s');
    expect(minimapFogAgeTipText(1000)).toMatch(/^Edad niebla \u00b7 /);
    // Scout reveal age uses a different max-life; compare at age 0 for a stable peer string.
    expect(tipEs).not.toBe(
      minimapFogRevealAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Explora · SE · 0s',
    );
    expect(minimapFogRevealAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS)).toMatch(
      /^Explora \u00b7 SE \u00b7 0s$/,
    );
    expect(tipEs).not.toBe(minimapCameraSectorTipText('SE'));
    expect(minimapCameraSectorTipText('SE')).toBe('Cám · SE');
    expect(minimapCameraSectorTipText('SE')).toMatch(/^Cám \u00b7 /);

    expect(tipEs).not.toMatch(/^Edad niebla \u00b7 /);
    expect(tipEs).not.toMatch(/^Explora \u00b7 /);
    expect(tipEs).not.toMatch(/^Cám \u00b7 /);
    expect(minimapPingSectorTipText('SE')).not.toMatch(/ \u00b7 \d+s$/);
    expect(tipEs).toMatch(/ \u00b7 \d+s$/);
    setLocale('en-GB');
  });
});
