import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { endAvgApmTipLine } from './endAvgApmTip';
import { endAvgDurationTipLine } from './endAvgDurationTip';
import { endBestApmTipLine } from './endBestApmTip';
import { lobbyAvgApmTipLine } from './lobbyAvgApmTip';
import { pauseApmTipLine } from './pauseApmTip';
import { pauseAvgApmTipLine } from './pauseAvgApmTip';

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

describe('endAvgApmTipLine', () => {
  it('is null when avg APM is missing or not usable', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endAvgApmTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(endAvgApmTipLine()).toBeNull();
  });

  it('labels Avg APM · n with middot, distinct from Best APM · / APM · / Avg time ·', () => {
    // 120 actions / 1 min = 120 APM; 60 actions / 2 min = 30 APM → avg 75
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().avgApm;
    expect(n).toBe(75);
    expect(loadMatchPrefs().avgApmSamples).toBe(2);
    expect(loadMatchPrefs().bestApm).toBe(120);
    const line = endAvgApmTipLine();
    expect(line).toBe(t('end.avgApmTip', { n: 75 }));
    expect(line).toBe('Avg APM · 75');
    expect(line).toMatch(/^Avg APM \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(line).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(line).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    // Distinct from peer career / match-rate tips.
    expect(line).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(endBestApmTipLine()).toBe('Best APM · 120');
    expect(endBestApmTipLine()).toMatch(/^Best APM \u00b7 /);
    expect(line).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(line).not.toMatch(/^Best APM \u00b7 /);
    expect(line).not.toMatch(/^APM \u00b7 /);
    expect(line).not.toMatch(/^Avg time \u00b7 /);
  });

  it('localizes Avg APM middot for pt-BR and es; stays distinct from Best APM / APM / Avg time', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().avgApm;

    setLocale('pt-BR');
    const pt = endAvgApmTipLine();
    expect(pt).toBe(t('end.avgApmTip', { n: 75 }));
    expect(pt).toBe('APM médio · 75');
    expect(pt).toMatch(/^APM médio \u00b7 /);
    expect(pt).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(pt).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    expect(pt).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(endBestApmTipLine()).toBe('Melhor APM · 120');
    expect(endBestApmTipLine()).toMatch(/^Melhor APM \u00b7 /);
    expect(pt).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(pt).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pt).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^Melhor APM \u00b7 /);
    expect(pt).not.toMatch(/^APM \u00b7 /);

    setLocale('es');
    const es = endAvgApmTipLine();
    expect(es).toBe(t('end.avgApmTip', { n: 75 }));
    expect(es).toBe('APM medio · 75');
    expect(es).toMatch(/^APM medio \u00b7 /);
    expect(es).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(es).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    expect(es).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(endBestApmTipLine()).toBe('Mejor APM · 120');
    expect(endBestApmTipLine()).toMatch(/^Mejor APM \u00b7 /);
    expect(es).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(es).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(es).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^Mejor APM \u00b7 /);
    expect(es).not.toMatch(/^APM \u00b7 /);
    setLocale('en-GB');
  });
});
