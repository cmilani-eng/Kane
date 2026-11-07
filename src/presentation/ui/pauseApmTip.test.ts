import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { endApmTipLine, matchApm } from './endApmTip';
import { pauseApmTipLine } from './pauseApmTip';
import { pauseAvgApmTipLine } from './pauseAvgApmTip';
import { pauseBestApmTipLine } from './pauseBestApmTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseApmTipLine', () => {
  it('labels APM · n with middot, distinct from Avg APM · / Best APM · / Time · / end APM key', () => {
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toBe('APM · 120');
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(pauseApmTipLine(0, 60_000)).toBe(t('pause.apmTip', { n: 0 }));
    expect(pauseApmTipLine(0, 60_000)).toBe('APM · 0');
    expect(matchApm(90, 30_000)).toBe(180);
    expect(pauseApmTipLine(90, 30_000)).toBe(t('pause.apmTip', { n: 180 }));
    expect(pauseApmTipLine(90, 30_000)).toBe('APM · 180');

    const line = pauseApmTipLine(120, 60_000);
    // Same en copy as end tip; distinct i18n key / surface.
    expect(line).toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(line).not.toBe(pauseAvgApmTipLine(120));
    expect(pauseAvgApmTipLine(120)).toBe(t('pause.avgApmTip', { n: 120 }));
    expect(pauseAvgApmTipLine(120)).toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toBe(pauseBestApmTipLine(120));
    expect(pauseBestApmTipLine(120)).toBe(t('pause.bestApmTip', { n: 120 }));
    expect(pauseBestApmTipLine(120)).toMatch(/^Best APM \u00b7 /);
    expect(line).not.toBe(pauseMatchClockTipLine(60_000));
    expect(pauseMatchClockTipLine(60_000)).toMatch(/^Time \u00b7 /);
    expect(line).not.toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toMatch(/^Best APM \u00b7 /);
    expect(line).not.toMatch(/^Time \u00b7 /);
  });

  it('localizes APM middot for pt-BR and es; stays distinct from Avg APM / Best APM / Time / end APM key', () => {
    setLocale('pt-BR');
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toBe('APM · 120');
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);

    const linePt = pauseApmTipLine(120, 60_000);
    expect(linePt).toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(linePt).not.toBe(pauseAvgApmTipLine(120));
    expect(pauseAvgApmTipLine(120)).toBe(t('pause.avgApmTip', { n: 120 }));
    expect(pauseAvgApmTipLine(120)).toBe('APM médio · 120');
    expect(linePt).not.toBe(pauseBestApmTipLine(120));
    expect(pauseBestApmTipLine(120)).toBe(t('pause.bestApmTip', { n: 120 }));
    expect(pauseBestApmTipLine(120)).toBe('Melhor APM · 120');
    expect(linePt).not.toBe(pauseMatchClockTipLine(60_000));
    expect(pauseMatchClockTipLine(60_000)).toMatch(/^Tempo \u00b7 /);
    expect(linePt).not.toMatch(/^APM médio \u00b7 /);
    expect(linePt).not.toMatch(/^Melhor APM \u00b7 /);

    setLocale('es');
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toBe('APM · 120');
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);

    const lineEs = pauseApmTipLine(120, 60_000);
    expect(lineEs).toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(lineEs).not.toBe(pauseAvgApmTipLine(120));
    expect(pauseAvgApmTipLine(120)).toBe(t('pause.avgApmTip', { n: 120 }));
    expect(pauseAvgApmTipLine(120)).toBe('APM medio · 120');
    expect(lineEs).not.toBe(pauseBestApmTipLine(120));
    expect(pauseBestApmTipLine(120)).toBe(t('pause.bestApmTip', { n: 120 }));
    expect(pauseBestApmTipLine(120)).toBe('Mejor APM · 120');
    expect(lineEs).not.toBe(pauseMatchClockTipLine(60_000));
    expect(pauseMatchClockTipLine(60_000)).toMatch(/^Tiempo \u00b7 /);
    expect(lineEs).not.toMatch(/^APM medio \u00b7 /);
    expect(lineEs).not.toMatch(/^Mejor APM \u00b7 /);
    setLocale('en-GB');
  });
});
