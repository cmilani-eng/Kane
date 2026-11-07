import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endApmTipLine, matchApm } from './endApmTip';
import { pauseApmTipLine } from './pauseApmTip';

describe('pauseApmTipLine', () => {
  it('labels APM · n with the same rate as the end tip', () => {
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM ·/);
    expect(pauseApmTipLine(0, 60_000)).toBe(t('pause.apmTip', { n: 0 }));
    expect(matchApm(90, 30_000)).toBe(180);
    expect(pauseApmTipLine(90, 30_000)).toBe(t('pause.apmTip', { n: 180 }));
    // Same numeric rate; pause uses its own i18n key (same en copy as end).
    expect(pauseApmTipLine(120, 60_000)).toBe(endApmTipLine(120, 60_000));
  });
});
