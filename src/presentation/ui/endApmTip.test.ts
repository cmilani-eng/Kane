import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endApmTipLine, matchApm } from './endApmTip';
import { endDurationTipLine } from './endDurationTip';
import { pauseApmTipLine } from './pauseApmTip';

describe('matchApm', () => {
  it('divides actions by match minutes', () => {
    expect(matchApm(120, 60_000)).toBe(120);
    expect(matchApm(60, 120_000)).toBe(30);
    expect(matchApm(0, 60_000)).toBe(0);
    expect(matchApm(10, 0)).toBe(0);
  });
});

describe('endApmTipLine', () => {
  it('labels APM · n, distinct from duration tip and pause tip key', () => {
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7/);
    expect(endApmTipLine(0, 60_000)).toBe(t('end.apmTip', { n: 0 }));
    expect(endApmTipLine(120, 60_000)).not.toBe(endDurationTipLine(60_000));
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(endApmTipLine(120, 60_000)).toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
  });
});
