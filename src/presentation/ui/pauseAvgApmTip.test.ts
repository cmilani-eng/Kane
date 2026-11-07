import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
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

describe('pauseAvgApmTipLine', () => {
  it('is null when avg APM is missing or negative', () => {
    expect(pauseAvgApmTipLine(undefined)).toBeNull();
    expect(pauseAvgApmTipLine(null)).toBeNull();
    expect(pauseAvgApmTipLine(-1)).toBeNull();
  });

  it('labels Avg APM · n from career prefs, distinct from lobby avg / pause match APM', () => {
    // 120 actions / 1 min = 120 APM; 60 actions / 2 min = 30 APM → avg 75
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().avgApm;
    expect(n).toBe(75);
    expect(loadMatchPrefs().avgApmSamples).toBe(2);
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 75 }));
    expect(pauseAvgApmTipLine(n)).toBe('Avg APM · 75');
    expect(pauseAvgApmTipLine(n)).toMatch(/^Avg APM \u00b7 /);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(pauseAvgApmTipLine(n)).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(pauseAvgApmTipLine(n)).not.toBe(pauseApmTipLine(120, 60_000));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM \u00b7 /);
  });

  it('localizes Avg APM middot for pt-BR and es; keys stay pause-scoped', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 60_000, true, 48);
    const n = loadMatchPrefs().avgApm;
    setLocale('pt-BR');
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 48 }));
    expect(pauseAvgApmTipLine(n)).toBe('APM médio · 48');
    expect(pauseAvgApmTipLine(n)).toMatch(/^APM médio \u00b7 /);
    expect(pauseAvgApmTipLine(n)).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 48 }));
    expect(pauseAvgApmTipLine(n)).not.toBe(pauseApmTipLine(48, 60_000));
    expect(pauseApmTipLine(48, 60_000)).toBe(t('pause.apmTip', { n: 48 }));
    setLocale('es');
    expect(pauseAvgApmTipLine(n)).toBe(t('pause.avgApmTip', { n: 48 }));
    expect(pauseAvgApmTipLine(n)).toBe('APM medio · 48');
    expect(pauseAvgApmTipLine(n)).toMatch(/^APM medio \u00b7 /);
    expect(pauseAvgApmTipLine(n)).toBe(lobbyAvgApmTipLine());
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 48 }));
    expect(pauseAvgApmTipLine(n)).not.toBe(pauseApmTipLine(48, 60_000));
    setLocale('en-GB');
  });
});
