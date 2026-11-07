import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { endAvgApmTipLine } from './endAvgApmTip';
import { lobbyAvgApmTipLine } from './lobbyAvgApmTip';
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

  it('labels Avg APM · n from career prefs, distinct from lobby/pause avg and match APM', () => {
    // 120 actions / 1 min = 120 APM; 60 actions / 2 min = 30 APM → avg 75
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().avgApm;
    expect(n).toBe(75);
    expect(loadMatchPrefs().avgApmSamples).toBe(2);
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe('Avg APM · 75');
    expect(endAvgApmTipLine()).toMatch(/^Avg APM \u00b7 /);
    // Same en copy as lobby/pause tip; distinct i18n key / surface.
    expect(endAvgApmTipLine()).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    expect(endAvgApmTipLine()).not.toBe(endApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
  });

  it('localizes Avg APM middot for pt-BR and es; keys stay end-scoped', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 60_000, true, 48);
    const n = loadMatchPrefs().avgApm;
    setLocale('pt-BR');
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 48 }));
    expect(endAvgApmTipLine()).toBe('APM médio · 48');
    expect(endAvgApmTipLine()).toMatch(/^APM médio \u00b7 /);
    expect(endAvgApmTipLine()).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 48 }));
    expect(endAvgApmTipLine()).toBe(pauseAvgApmTipLine(n));
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 48 }));
    expect(endAvgApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    expect(endApmTipLine(48, 60_000)).toBe(t('end.apmTip', { n: 48 }));
    setLocale('es');
    expect(endAvgApmTipLine()).toBe(t('end.avgApmTip', { n: 48 }));
    expect(endAvgApmTipLine()).toBe('APM medio · 48');
    expect(endAvgApmTipLine()).toMatch(/^APM medio \u00b7 /);
    expect(endAvgApmTipLine()).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 48 }));
    expect(endAvgApmTipLine()).toBe(pauseAvgApmTipLine(n));
    expect(endAvgApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    setLocale('en-GB');
  });
});
