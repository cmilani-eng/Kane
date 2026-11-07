import { describe, expect, it } from 'vitest';
import { ATTENTION_PING_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';
import { setLocale, t } from '../../i18n';
import { minimapCameraSectorTipText } from './minimapCameraSectorTip';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapPingAgeTip } from './minimapPingAgeTip';
import {
  minimapPingSectorTipAlpha,
  minimapPingSectorTipText,
} from './minimapPingSectorTip';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';

describe('minimapPingSectorTip', () => {
  it('labels Mark · sector with middot, distinct from Mark age / Scout · / Fog age · / Cam ·', () => {
    const tip = minimapPingSectorTipText('NW');
    expect(tip).toBe(t('hud.pingSector', { sector: 'NW' }));
    expect(tip).toBe('Mark · NW');
    expect(tip).toMatch(/^Mark \u00b7 /);
    expect(minimapPingSectorTipText('SE')).toBe('Mark · SE');
    expect(minimapPingSectorTipText('SE')).toMatch(/^Mark \u00b7 /);

    expect(tip).not.toBe(
      minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS),
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Mark · NW · 0s',
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toMatch(
      /^Mark \u00b7 /,
    );
    expect(tip).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Scout · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Scout \u00b7 /);
    expect(tip).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Fog age · 0s');
    expect(minimapFogAgeTipText(0)).toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe('Cam · NW');
    expect(minimapCameraSectorTipText('NW')).toMatch(/^Cam \u00b7 /);
    expect(tip).not.toMatch(/^Scout \u00b7 /);
    expect(tip).not.toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toMatch(/^Cam \u00b7 /);
    expect(tip).not.toMatch(/ \u00b7 \d+s$/);
  });

  it('localizes Mark · sector middot for pt-BR and es; stays distinct from Mark age / Scout / Fog age / Cam', () => {
    setLocale('pt-BR');
    const pt = minimapPingSectorTipText('NW');
    expect(pt).toBe(t('hud.pingSector', { sector: 'NW' }));
    expect(pt).toBe('Marca · NW');
    expect(pt).toMatch(/^Marca \u00b7 /);
    expect(pt).not.toBe(
      minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS),
    );
    expect(minimapPingAgeTip('NW', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Marca · NW · 0s',
    );
    expect(pt).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Revela · NW');
    expect(pt).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Idade névoa · 0s');
    expect(pt).not.toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe('Câm · NW');
    expect(pt).not.toMatch(/^Revela \u00b7 /);
    expect(pt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(pt).not.toMatch(/^Câm \u00b7 /);
    expect(pt).not.toMatch(/ \u00b7 \d+s$/);

    setLocale('es');
    const es = minimapPingSectorTipText('SE');
    expect(es).toBe(t('hud.pingSector', { sector: 'SE' }));
    expect(es).toBe('Marca · SE');
    expect(es).toMatch(/^Marca \u00b7 /);
    expect(es).not.toBe(
      minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS),
    );
    expect(minimapPingAgeTip('SE', ATTENTION_PING_SECTOR_HINT_MS)).toBe(
      'Marca · SE · 0s',
    );
    expect(es).not.toBe(minimapScoutPulseLabelText('SE'));
    expect(minimapScoutPulseLabelText('SE')).toBe('Explora · SE');
    expect(es).not.toBe(minimapFogAgeTipText(0));
    expect(minimapFogAgeTipText(0)).toBe('Edad niebla · 0s');
    expect(es).not.toBe(minimapCameraSectorTipText('SE'));
    expect(minimapCameraSectorTipText('SE')).toBe('Cám · SE');
    expect(es).not.toMatch(/^Explora \u00b7 /);
    expect(es).not.toMatch(/^Edad niebla \u00b7 /);
    expect(es).not.toMatch(/^Cám \u00b7 /);
    expect(es).not.toMatch(/ \u00b7 \d+s$/);
    setLocale('en-GB');
  });

  it('fades with remaining hint life', () => {
    expect(
      minimapPingSectorTipAlpha(ATTENTION_PING_SECTOR_HINT_MS),
    ).toBeGreaterThan(minimapPingSectorTipAlpha(100));
    expect(minimapPingSectorTipAlpha(0)).toBe(0);
  });
});
