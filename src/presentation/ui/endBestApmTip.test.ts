import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { endAvgApmTipLine } from './endAvgApmTip';
import { endAvgDurationTipLine } from './endAvgDurationTip';
import { endBestApmTipLine } from './endBestApmTip';
import { lobbyBestApmTipLine } from './lobbyBestApmTip';
import { pauseApmTipLine } from './pauseApmTip';
import { pauseBestApmTipLine } from './pauseBestApmTip';

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

describe('endBestApmTipLine', () => {
  it('is null when best APM is missing or not usable', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endBestApmTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(endBestApmTipLine()).toBeNull();
  });

  it('labels Best APM · n with middot, distinct from Avg APM · / APM · / Avg time ·', () => {
    // 120 actions / 1 min = 120 APM; 60 actions / 2 min = 30 APM → peak 120; avg 75
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().bestApm;
    expect(n).toBe(120);
    expect(loadMatchPrefs().avgApm).toBe(75);
    expect(loadMatchPrefs().avgApmSamples).toBe(2);
    const line = endBestApmTipLine();
    expect(line).toBe(t('end.bestApmTip', { n: 120 }));
    expect(line).toBe('Best APM · 120');
    expect(line).toMatch(/^Best APM \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(line).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(line).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 120 }));
    // Distinct from peer career / match-rate tips.
    expect(line).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe('Avg APM · 75');
    expect(endAvgApmTipLine()).toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(line).not.toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toMatch(/^APM \u00b7 /);
    expect(line).not.toMatch(/^Avg time \u00b7 /);
  });

  it('localizes Best APM middot for pt-BR and es; stays distinct from Avg APM / APM / Avg time', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().bestApm;

    setLocale('pt-BR');
    const pt = endBestApmTipLine();
    expect(pt).toBe(t('end.bestApmTip', { n: 120 }));
    expect(pt).toBe('Melhor APM · 120');
    expect(pt).toMatch(/^Melhor APM \u00b7 /);
    expect(pt).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(pt).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 120 }));
    expect(pt).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe('APM médio · 75');
    expect(endAvgApmTipLine()).toMatch(/^APM médio \u00b7 /);
    expect(pt).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(pt).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pt).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^APM médio \u00b7 /);
    expect(pt).not.toMatch(/^APM \u00b7 /);

    setLocale('es');
    const es = endBestApmTipLine();
    expect(es).toBe(t('end.bestApmTip', { n: 120 }));
    expect(es).toBe('Mejor APM · 120');
    expect(es).toMatch(/^Mejor APM \u00b7 /);
    expect(es).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(es).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 120 }));
    expect(es).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe('APM medio · 75');
    expect(endAvgApmTipLine()).toMatch(/^APM medio \u00b7 /);
    expect(es).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(es).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(es).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^APM medio \u00b7 /);
    expect(es).not.toMatch(/^APM \u00b7 /);
    setLocale('en-GB');
  });
});
