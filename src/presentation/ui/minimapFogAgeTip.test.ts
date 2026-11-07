import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapFogAgeTipText } from './minimapFogAgeTip';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { minimapFogRevealAgeTip } from './minimapFogRevealAgeTip';
import { fogAgeSec, pauseFogAgeTipLine } from './pauseFogAgeTip';

describe('minimapFogAgeTipText', () => {
  it('labels Fog age · ns with middot, distinct from pause age / Fog · % / scout', () => {
    expect(minimapFogAgeTipText(2500)).toBe(
      t('hud.minimapFogAge', { sec: fogAgeSec(2500) }),
    );
    expect(minimapFogAgeTipText(2500)).toBe('Fog age · 2s');
    expect(minimapFogAgeTipText(2500)).toMatch(/^Fog age \u00b7 /);
    expect(minimapFogAgeTipText(2500)).toMatch(/2s$/);
    expect(minimapFogAgeTipText(null)).toBe(t('hud.minimapFogAge', { sec: 0 }));
    expect(minimapFogAgeTipText(undefined)).toBe(
      t('hud.minimapFogAge', { sec: 0 }),
    );
    expect(minimapFogAgeTipText(2500)).not.toBe(pauseFogAgeTipLine(2500));
    expect(minimapFogAgeTipText(2500)).not.toBe(minimapFogCoverageTipText(2));
    expect(minimapFogAgeTipText(0)).not.toBe(
      minimapFogRevealAgeTip('NW', 0),
    );
    expect(pauseFogAgeTipLine(2500)).toBe(t('pause.fogAgeTip', { sec: 2 }));
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
  });

  it('localizes Fog age middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(minimapFogAgeTipText(4000)).toBe(
      t('hud.minimapFogAge', { sec: 4 }),
    );
    expect(minimapFogAgeTipText(4000)).toBe('Idade névoa · 4s');
    expect(minimapFogAgeTipText(4000)).toMatch(/^Idade névoa ·/);
    expect(minimapFogAgeTipText(4000)).not.toBe(
      t('pause.fogAgeTip', { sec: 4 }),
    );
    setLocale('es');
    expect(minimapFogAgeTipText(4000)).toBe(
      t('hud.minimapFogAge', { sec: 4 }),
    );
    expect(minimapFogAgeTipText(4000)).toBe('Edad niebla · 4s');
    expect(minimapFogAgeTipText(4000)).toMatch(/^Edad niebla ·/);
    expect(minimapFogAgeTipText(4000)).not.toBe(
      t('pause.fogAgeTip', { sec: 4 }),
    );
    setLocale('en-GB');
  });
});
