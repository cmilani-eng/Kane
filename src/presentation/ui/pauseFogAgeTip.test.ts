import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { fogAgeSec, pauseFogAgeTipLine } from './pauseFogAgeTip';

describe('pauseFogAgeTipLine', () => {
  it('counts whole seconds since the last fog reveal', () => {
    expect(fogAgeSec(0)).toBe(0);
    expect(fogAgeSec(999)).toBe(0);
    expect(fogAgeSec(1000)).toBe(1);
    expect(fogAgeSec(4500)).toBe(4);
  });

  it('labels Fog · ns', () => {
    const tip = pauseFogAgeTipLine(2500);
    expect(tip).toBe(t('pause.fogAgeTip', { sec: 2 }));
    expect(tip).toMatch(/^Fog ·/);
    expect(tip).toMatch(/2s|2\s*s/);
  });
});
