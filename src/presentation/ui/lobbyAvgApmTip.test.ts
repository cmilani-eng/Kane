import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { endAvgApmTipLine } from './endAvgApmTip';
import { lobbyAvgApmTipLine } from './lobbyAvgApmTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestApmTipLine } from './lobbyBestApmTip';
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

describe('lobbyAvgApmTipLine', () => {
  it('returns null before any finished match with actions', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyAvgApmTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(lobbyAvgApmTipLine()).toBeNull();
  });

  it('labels Avg APM · n with middot, distinct from Best APM · / APM · / Avg time ·', () => {
    // 120 actions / 1 min = 120 APM; 60 actions / 2 min = 30 APM → avg 75
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().avgApm;
    expect(n).toBe(75);
    expect(loadMatchPrefs().avgApmSamples).toBe(2);
    expect(loadMatchPrefs().bestApm).toBe(120);
    const line = lobbyAvgApmTipLine();
    expect(line).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(line).toBe('Avg APM · 75');
    expect(line).toMatch(/^Avg APM \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(line).toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(line).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    // Distinct from peer career / match-rate tips.
    expect(line).not.toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(lobbyBestApmTipLine()).toBe('Best APM · 120');
    expect(lobbyBestApmTipLine()).toMatch(/^Best APM \u00b7 /);
    expect(line).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(line).not.toMatch(/^Best APM \u00b7 /);
    expect(line).not.toMatch(/^APM \u00b7 /);
    expect(line).not.toMatch(/^Avg time \u00b7 /);
  });

  it('ignores remembers without actions and keeps average when outcome omitted', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge', 60_000, true, 90);
    expect(loadMatchPrefs().avgApm).toBe(90);
    expect(loadMatchPrefs().avgApmSamples).toBe(1);
    rememberMatchPrefs('nobles', 'easy', 'gap', 120_000, false);
    expect(loadMatchPrefs().avgApm).toBe(90);
    expect(loadMatchPrefs().avgApmSamples).toBe(1);
    rememberMatchPrefs('weirdos', 'hard', 'crossing');
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 90 }));
  });

  it('localizes Avg APM middot for pt-BR and es; stays distinct from Best APM / APM / Avg time', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().avgApm;

    setLocale('pt-BR');
    const pt = lobbyAvgApmTipLine();
    expect(pt).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(pt).toBe('APM médio · 75');
    expect(pt).toMatch(/^APM médio \u00b7 /);
    expect(pt).toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(pt).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    expect(pt).not.toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(lobbyBestApmTipLine()).toBe('Melhor APM · 120');
    expect(lobbyBestApmTipLine()).toMatch(/^Melhor APM \u00b7 /);
    expect(pt).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(pt).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pt).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^Melhor APM \u00b7 /);
    expect(pt).not.toMatch(/^APM \u00b7 /);

    setLocale('es');
    const es = lobbyAvgApmTipLine();
    expect(es).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(es).toBe('APM medio · 75');
    expect(es).toMatch(/^APM medio \u00b7 /);
    expect(es).toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(es).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    expect(es).not.toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(lobbyBestApmTipLine()).toBe('Mejor APM · 120');
    expect(lobbyBestApmTipLine()).toMatch(/^Mejor APM \u00b7 /);
    expect(es).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(es).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(es).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^Mejor APM \u00b7 /);
    expect(es).not.toMatch(/^APM \u00b7 /);
    setLocale('en-GB');
  });
});
