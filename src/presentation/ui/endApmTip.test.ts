import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine, matchApm } from './endApmTip';
import { endAvgApmTipLine } from './endAvgApmTip';
import { endBestApmTipLine } from './endBestApmTip';
import { endDurationTipLine } from './endDurationTip';
import { pauseApmTipLine } from './pauseApmTip';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  setLocale('en-GB');
});

describe('matchApm', () => {
  it('divides actions by match minutes', () => {
    expect(matchApm(120, 60_000)).toBe(120);
    expect(matchApm(60, 120_000)).toBe(30);
    expect(matchApm(0, 60_000)).toBe(0);
    expect(matchApm(10, 0)).toBe(0);
  });
});

describe('endApmTipLine', () => {
  it('labels APM · n with middot, distinct from Avg APM · / Best APM · / Time · / pause APM key', () => {
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toBe('APM · 120');
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(endApmTipLine(0, 60_000)).toBe(t('end.apmTip', { n: 0 }));
    expect(endApmTipLine(0, 60_000)).toBe('APM · 0');
    expect(matchApm(90, 30_000)).toBe(180);
    expect(endApmTipLine(90, 30_000)).toBe(t('end.apmTip', { n: 180 }));
    expect(endApmTipLine(90, 30_000)).toBe('APM · 180');

    const line = endApmTipLine(120, 60_000);
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(line).toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));

    // Career Avg/Best APM peers need prefs with action samples.
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    expect(line).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe('Avg APM · 75');
    expect(endAvgApmTipLine()).toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(endBestApmTipLine()).toBe('Best APM · 120');
    expect(endBestApmTipLine()).toMatch(/^Best APM \u00b7 /);
    expect(line).not.toBe(endDurationTipLine(60_000));
    expect(endDurationTipLine(60_000)).toMatch(/^Time \u00b7 /);
    expect(line).not.toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toMatch(/^Best APM \u00b7 /);
    expect(line).not.toMatch(/^Time \u00b7 /);
  });

  it('localizes APM middot for pt-BR and es; stays distinct from Avg APM / Best APM / Time / pause APM key', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);

    setLocale('pt-BR');
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toBe('APM · 120');
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);

    const linePt = endApmTipLine(120, 60_000);
    expect(linePt).toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(linePt).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe('APM médio · 75');
    expect(linePt).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(endBestApmTipLine()).toBe('Melhor APM · 120');
    expect(linePt).not.toBe(endDurationTipLine(60_000));
    expect(endDurationTipLine(60_000)).toMatch(/^Tempo \u00b7 /);
    expect(linePt).not.toMatch(/^APM médio \u00b7 /);
    expect(linePt).not.toMatch(/^Melhor APM \u00b7 /);

    setLocale('es');
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toBe('APM · 120');
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);

    const lineEs = endApmTipLine(120, 60_000);
    expect(lineEs).toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(lineEs).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe('APM medio · 75');
    expect(lineEs).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(endBestApmTipLine()).toBe('Mejor APM · 120');
    expect(lineEs).not.toBe(endDurationTipLine(60_000));
    expect(endDurationTipLine(60_000)).toMatch(/^Tiempo \u00b7 /);
    expect(lineEs).not.toMatch(/^APM medio \u00b7 /);
    expect(lineEs).not.toMatch(/^Mejor APM \u00b7 /);
    setLocale('en-GB');
  });
});
