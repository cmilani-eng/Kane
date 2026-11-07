import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endApmTipLine, matchApm } from './endApmTip';

describe('matchApm', () => {
  it('divides actions by match minutes', () => {
    expect(matchApm(120, 60_000)).toBe(120);
    expect(matchApm(60, 120_000)).toBe(30);
    expect(matchApm(0, 60_000)).toBe(0);
    expect(matchApm(10, 0)).toBe(0);
  });
});

describe('endApmTipLine', () => {
  it('labels APM · n', () => {
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM ·/);
    expect(endApmTipLine(0, 60_000)).toBe(t('end.apmTip', { n: 0 }));
  });
});
