import { beforeEach, describe, expect, it } from 'vitest';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { fogAgeSec, pauseFogAgeTipLine } from './pauseFogAgeTip';
import { pauseFogCoverageTipLine } from './pauseFogCoverageTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseFogAgeTipLine', () => {
  it('counts whole seconds since the last fog reveal', () => {
    expect(fogAgeSec(0)).toBe(0);
    expect(fogAgeSec(999)).toBe(0);
    expect(fogAgeSec(1000)).toBe(1);
    expect(fogAgeSec(4500)).toBe(4);
  });

  it('labels Fog · ns with middot, distinct from Fog · % / Fog age · / Scout · / Vision ·', () => {
    const tip = pauseFogAgeTipLine(2500);
    expect(tip).toBe(t('pause.fogAgeTip', { sec: 2 }));
    expect(tip).toBe('Fog · 2s');
    expect(tip).toMatch(/^Fog \u00b7 /);
    expect(tip).toMatch(/ \u00b7 2s$/);
    expect(pauseFogAgeTipLine(0)).toBe('Fog · 0s');
    expect(pauseFogAgeTipLine(0)).toMatch(/^Fog \u00b7 /);
    expect(pauseFogAgeTipLine(999)).toBe('Fog · 0s');
    expect(pauseFogAgeTipLine(1000)).toBe('Fog · 1s');
    expect(pauseFogAgeTipLine(1000)).toMatch(/^Fog \u00b7 /);

    expect(tip).not.toBe(pauseFogCoverageTipLine(2));
    expect(pauseFogCoverageTipLine(2)).toBe('Fog · 2%');
    expect(pauseFogCoverageTipLine(2)).toMatch(/^Fog \u00b7 /);
    expect(tip).not.toBe(minimapFogCoverageTipText(2));
    expect(minimapFogCoverageTipText(2)).toBe('Fog · 2%');
    expect(tip).not.toBe(minimapFogAgeTipText(2500));
    expect(minimapFogAgeTipText(2500)).toBe('Fog age · 2s');
    expect(minimapFogAgeTipText(2500)).toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Scout · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Scout \u00b7 /,
    );
    expect(tip).not.toBe(minimapVisionTipText(2));
    expect(minimapVisionTipText(2)).toBe('Vision · 2');
    expect(minimapVisionTipText(2)).toMatch(/^Vision \u00b7 /);

    expect(tip).not.toMatch(/^Fog age \u00b7 /);
    expect(tip).not.toMatch(/^Scout \u00b7 /);
    expect(tip).not.toMatch(/^Vision \u00b7 /);
    expect(tip).not.toMatch(/%$/);
    expect(tip).toMatch(/s$/);
  });

  it('localizes Fog middot for pt-BR and es; stays distinct from Fog · % / Fog age · / Scout · / Vision ·', () => {
    setLocale('pt-BR');
    const pt = pauseFogAgeTipLine(4000);
    expect(pt).toBe(t('pause.fogAgeTip', { sec: 4 }));
    expect(pt).toBe('Névoa · 4s');
    expect(pt).toMatch(/^Névoa \u00b7 /);
    expect(pt).toMatch(/ \u00b7 4s$/);
    expect(pt).not.toBe(pauseFogCoverageTipLine(4));
    expect(pauseFogCoverageTipLine(4)).toBe('Névoa · 4%');
    expect(pauseFogCoverageTipLine(4)).toMatch(/^Névoa \u00b7 /);
    expect(pt).not.toBe(minimapFogAgeTipText(4000));
    expect(minimapFogAgeTipText(4000)).toBe('Idade névoa · 4s');
    expect(minimapFogAgeTipText(4000)).toMatch(/^Idade névoa \u00b7 /);
    expect(pt).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Revela · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Revela \u00b7 /,
    );
    expect(pt).not.toBe(minimapVisionTipText(4));
    expect(minimapVisionTipText(4)).toBe('Visão · 4');
    expect(minimapVisionTipText(4)).toMatch(/^Visão \u00b7 /);
    expect(pt).not.toMatch(/^Idade névoa \u00b7 /);
    expect(pt).not.toMatch(/^Revela \u00b7 /);
    expect(pt).not.toMatch(/^Visão \u00b7 /);
    expect(pt).not.toMatch(/%$/);

    setLocale('es');
    const es = pauseFogAgeTipLine(4000);
    expect(es).toBe(t('pause.fogAgeTip', { sec: 4 }));
    expect(es).toBe('Niebla · 4s');
    expect(es).toMatch(/^Niebla \u00b7 /);
    expect(es).toMatch(/ \u00b7 4s$/);
    expect(es).not.toBe(pauseFogCoverageTipLine(4));
    expect(pauseFogCoverageTipLine(4)).toBe('Niebla · 4%');
    expect(pauseFogCoverageTipLine(4)).toMatch(/^Niebla \u00b7 /);
    expect(es).not.toBe(minimapFogAgeTipText(4000));
    expect(minimapFogAgeTipText(4000)).toBe('Edad niebla · 4s');
    expect(minimapFogAgeTipText(4000)).toMatch(/^Edad niebla \u00b7 /);
    expect(es).not.toBe(
      minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toBe(
      'Explora · SE · 0s',
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Explora \u00b7 /,
    );
    expect(es).not.toBe(minimapVisionTipText(4));
    expect(minimapVisionTipText(4)).toBe('Visión · 4');
    expect(minimapVisionTipText(4)).toMatch(/^Visión \u00b7 /);
    expect(es).not.toMatch(/^Edad niebla \u00b7 /);
    expect(es).not.toMatch(/^Explora \u00b7 /);
    expect(es).not.toMatch(/^Visión \u00b7 /);
    expect(es).not.toMatch(/%$/);
    setLocale('en-GB');
  });
});
