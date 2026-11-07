import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapFogCoverageTipText } from './minimapFogCoverageTip';
import { pauseFogAgeTipLine } from './pauseFogAgeTip';
import { pauseFogCoverageTipLine } from './pauseFogCoverageTip';

describe('pauseFogCoverageTipLine', () => {
  it('labels Fog · pct%, distinct from age tip; same en copy as minimap', () => {
    expect(pauseFogCoverageTipLine(42)).toBe(
      t('pause.fogCoverageTip', { pct: 42 }),
    );
    expect(pauseFogCoverageTipLine(42)).toMatch(/^Fog ·/);
    expect(pauseFogCoverageTipLine(42)).toMatch(/%$/);
    expect(pauseFogCoverageTipLine(150)).toBe(
      t('pause.fogCoverageTip', { pct: 100 }),
    );
    expect(pauseFogCoverageTipLine(42)).not.toBe(pauseFogAgeTipLine(42_000));
    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(pauseFogCoverageTipLine(42)).toBe(minimapFogCoverageTipText(42));
  });
});
