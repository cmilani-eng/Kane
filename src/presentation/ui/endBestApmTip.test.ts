import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { endAvgApmTipLine } from './endAvgApmTip';
import { endBestApmTipLine } from './endBestApmTip';
import { lobbyBestApmTipLine } from './lobbyBestApmTip';
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

  it('labels Best APM · n from career prefs, distinct from lobby/pause Best / Avg / match APM', () => {
    // 90 APM then 30 APM → peak 90; avg 60
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().bestApm;
    expect(n).toBe(90);
    expect(loadMatchPrefs().avgApm).toBe(60);
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 90 }));
    expect(endBestApmTipLine()).toBe('Best APM · 90');
    expect(endBestApmTipLine()).toMatch(/^Best APM \u00b7 /);
    // Same en copy as lobby/pause tip; distinct i18n key / surface.
    expect(endBestApmTipLine()).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 90 }));
    expect(endBestApmTipLine()).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 90 }));
    expect(endBestApmTipLine()).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 60 }));
    expect(endAvgApmTipLine()).toMatch(/^Avg APM \u00b7 /);
    expect(endBestApmTipLine()).not.toBe(endApmTipLine(90, 60_000));
    expect(endApmTipLine(90, 60_000)).toBe(t('end.apmTip', { n: 90 }));
    expect(endApmTipLine(90, 60_000)).toMatch(/^APM \u00b7 /);
  });

  it('localizes Best APM middot for pt-BR and es; keys stay end-scoped', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 60_000, true, 48);
    const n = loadMatchPrefs().bestApm;
    setLocale('pt-BR');
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 48 }));
    expect(endBestApmTipLine()).toBe('Melhor APM · 48');
    expect(endBestApmTipLine()).toMatch(/^Melhor APM \u00b7 /);
    expect(endBestApmTipLine()).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 48 }));
    expect(endBestApmTipLine()).toBe(pauseBestApmTipLine(n));
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 48 }));
    expect(endBestApmTipLine()).not.toBe(endAvgApmTipLine());
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 48 }));
    expect(endBestApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    expect(endApmTipLine(48, 60_000)).toBe(t('end.apmTip', { n: 48 }));
    setLocale('es');
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 48 }));
    expect(endBestApmTipLine()).toBe('Mejor APM · 48');
    expect(endBestApmTipLine()).toMatch(/^Mejor APM \u00b7 /);
    expect(endBestApmTipLine()).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 48 }));
    expect(endBestApmTipLine()).toBe(pauseBestApmTipLine(n));
    expect(endBestApmTipLine()).not.toBe(endAvgApmTipLine());
    expect(endBestApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    setLocale('en-GB');
  });
});
