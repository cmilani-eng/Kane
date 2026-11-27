import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { endBestApmTipLine } from './endBestApmTip';
import { lobbyAvgApmTipLine } from './lobbyAvgApmTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
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

describe('lobbyBestApmTipLine', () => {
  it('returns null before any finished match with actions', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyBestApmTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(lobbyBestApmTipLine()).toBeNull();
  });

  it('labels Best APM · n with middot, distinct from Avg APM · / APM · / Avg time ·', () => {
    // 120 actions / 1 min = 120 APM; 60 actions / 2 min = 30 APM → peak 120; avg 75
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().bestApm;
    expect(n).toBe(120);
    expect(loadMatchPrefs().avgApm).toBe(75);
    expect(loadMatchPrefs().avgApmSamples).toBe(2);
    const line = lobbyBestApmTipLine();
    expect(line).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(line).toBe('Best APM · 120');
    expect(line).toMatch(/^Best APM \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(line).toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(line).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 120 }));
    // Distinct from peer career / match-rate tips.
    expect(line).not.toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(lobbyAvgApmTipLine()).toBe('Avg APM · 75');
    expect(lobbyAvgApmTipLine()).toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
    expect(line).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(line).not.toMatch(/^Avg APM \u00b7 /);
    expect(line).not.toMatch(/^APM \u00b7 /);
    expect(line).not.toMatch(/^Avg time \u00b7 /);
  });

  it('raises peak only when a later match exceeds prior best', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge', 60_000, true, 80);
    expect(loadMatchPrefs().bestApm).toBe(80);
    rememberMatchPrefs('nobles', 'easy', 'gap', 60_000, false, 70);
    expect(loadMatchPrefs().bestApm).toBe(80);
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 110);
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 110 }));
    rememberMatchPrefs('nobles', 'normal', 'ridge');
    expect(lobbyBestApmTipLine()).toBe('Best APM · 110');
  });

  it('localizes Best APM middot for pt-BR and es; stays distinct from Avg APM / APM / Avg time', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().bestApm;

    setLocale('pt-BR');
    const pt = lobbyBestApmTipLine();
    expect(pt).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(pt).toBe('Melhor APM · 120');
    expect(pt).toMatch(/^Melhor APM \u00b7 /);
    expect(pt).toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(pt).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 120 }));
    expect(pt).not.toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(lobbyAvgApmTipLine()).toBe('APM médio · 75');
    expect(lobbyAvgApmTipLine()).toMatch(/^APM médio \u00b7 /);
    expect(pt).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(pt).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pt).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^APM médio \u00b7 /);
    expect(pt).not.toMatch(/^APM \u00b7 /);

    setLocale('es');
    const es = lobbyBestApmTipLine();
    expect(es).toBe(t('lobby.bestApmTip', { n: 120 }));
    expect(es).toBe('Mejor APM · 120');
    expect(es).toMatch(/^Mejor APM \u00b7 /);
    expect(es).toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 120 }));
    expect(es).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 120 }));
    expect(es).not.toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(lobbyAvgApmTipLine()).toBe('APM medio · 75');
    expect(lobbyAvgApmTipLine()).toMatch(/^APM medio \u00b7 /);
    expect(es).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(es).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(es).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^APM medio \u00b7 /);
    expect(es).not.toMatch(/^APM \u00b7 /);
    setLocale('en-GB');
  });
});
