import { describe, expect, it } from 'vitest';
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import { fogAgeSec, pauseFogAgeTipLine } from './pauseFogAgeTip';

describe('minimapFogAgeTipText', () => {
  it('labels Fog age · ns with middot, distinct from pause Fog · / Fog · % / Scout ·', () => {
    expect(minimapFogAgeTipText(2500)).toBe(
      t('hud.minimapFogAge', { sec: fogAgeSec(2500) }),
    );
    expect(minimapFogAgeTipText(2500)).toBe('Fog age · 2s');
    expect(minimapFogAgeTipText(2500)).toMatch(/^Fog age \u00b7 /);
    expect(minimapFogAgeTipText(2500)).toMatch(/ \u00b7 2s$/);
    expect(minimapFogAgeTipText(null)).toBe(t('hud.minimapFogAge', { sec: 0 }));
    expect(minimapFogAgeTipText(null)).toBe('Fog age · 0s');
    expect(minimapFogAgeTipText(null)).toMatch(/^Fog age \u00b7 /);
    expect(minimapFogAgeTipText(undefined)).toBe(
      t('hud.minimapFogAge', { sec: 0 }),
    );
    expect(minimapFogAgeTipText(undefined)).toBe('Fog age · 0s');

    const fogAge = minimapFogAgeTipText(2500);
    expect(fogAge).not.toBe(pauseFogAgeTipLine(2500));
    expect(pauseFogAgeTipLine(2500)).toBe(t('pause.fogAgeTip', { sec: 2 }));
    expect(pauseFogAgeTipLine(2500)).toBe('Fog · 2s');
    expect(pauseFogAgeTipLine(2500)).toMatch(/^Fog \u00b7 /);
    expect(fogAge).not.toBe(minimapFogCoverageTipText(2));
    expect(minimapFogCoverageTipText(2)).toBe('Fog · 2%');
    expect(minimapFogCoverageTipText(2)).toMatch(/^Fog \u00b7 /);
    expect(fogAge).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Scout · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Scout \u00b7 /,
    );

    expect(fogAge).not.toMatch(/^Fog \u00b7 /);
    expect(fogAge).not.toMatch(/^Scout \u00b7 /);
    expect(fogAge).not.toMatch(/%$/);
  });

  it('localizes Fog age middot for pt-BR and es; stays distinct from pause Fog / Fog · % / Scout ·', () => {
    setLocale('pt-BR');
    expect(minimapFogAgeTipText(4000)).toBe(
      t('hud.minimapFogAge', { sec: 4 }),
    );
    expect(minimapFogAgeTipText(4000)).toBe('Idade névoa · 4s');
    expect(minimapFogAgeTipText(4000)).toMatch(/^Idade névoa \u00b7 /);
    expect(minimapFogAgeTipText(4000)).toMatch(/ \u00b7 4s$/);

    const fogAgePt = minimapFogAgeTipText(4000);
    expect(fogAgePt).not.toBe(pauseFogAgeTipLine(4000));
    expect(pauseFogAgeTipLine(4000)).toBe('Névoa · 4s');
    expect(pauseFogAgeTipLine(4000)).toMatch(/^Névoa \u00b7 /);
    expect(fogAgePt).not.toBe(minimapFogCoverageTipText(4));
    expect(minimapFogCoverageTipText(4)).toBe('Névoa · 4%');
    expect(minimapFogCoverageTipText(4)).toMatch(/^Névoa \u00b7 /);
    expect(fogAgePt).not.toBe(
      minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toBe(
      'Revela · NW · 0s',
    );
    expect(minimapFogRevealAgeTip('NW', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Revela \u00b7 /,
    );
    expect(fogAgePt).not.toMatch(/^Névoa \u00b7 /);
    expect(fogAgePt).not.toMatch(/^Revela \u00b7 /);
    expect(fogAgePt).not.toMatch(/%$/);

    setLocale('es');
    expect(minimapFogAgeTipText(4000)).toBe(
      t('hud.minimapFogAge', { sec: 4 }),
    );
    expect(minimapFogAgeTipText(4000)).toBe('Edad niebla · 4s');
    expect(minimapFogAgeTipText(4000)).toMatch(/^Edad niebla \u00b7 /);
    expect(minimapFogAgeTipText(4000)).toMatch(/ \u00b7 4s$/);

    const fogAgeEs = minimapFogAgeTipText(4000);
    expect(fogAgeEs).not.toBe(pauseFogAgeTipLine(4000));
    expect(pauseFogAgeTipLine(4000)).toBe('Niebla · 4s');
    expect(pauseFogAgeTipLine(4000)).toMatch(/^Niebla \u00b7 /);
    expect(fogAgeEs).not.toBe(minimapFogCoverageTipText(4));
    expect(minimapFogCoverageTipText(4)).toBe('Niebla · 4%');
    expect(minimapFogCoverageTipText(4)).toMatch(/^Niebla \u00b7 /);
    expect(fogAgeEs).not.toBe(
      minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS),
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toBe(
      'Explora · SE · 0s',
    );
    expect(minimapFogRevealAgeTip('SE', SCOUT_SECTOR_HINT_MS)).toMatch(
      /^Explora \u00b7 /,
    );
    expect(fogAgeEs).not.toMatch(/^Niebla \u00b7 /);
    expect(fogAgeEs).not.toMatch(/^Explora \u00b7 /);
    expect(fogAgeEs).not.toMatch(/%$/);
    setLocale('en-GB');
  });
});
