import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyBestApmTipLine } from './lobbyBestApmTip';
import { pauseApmTipLine } from './pauseApmTip';
import { pauseAvgApmTipLine } from './pauseAvgApmTip';
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

describe('pauseBestApmTipLine', () => {
  it('is null when best APM is missing or negative', () => {
    expect(pauseBestApmTipLine(undefined)).toBeNull();
    expect(pauseBestApmTipLine(null)).toBeNull();
    expect(pauseBestApmTipLine(-1)).toBeNull();
  });

  it('labels Best APM · n from career prefs, distinct from lobby Best / pause Avg / match APM', () => {
    // 90 APM then 30 APM → peak 90; avg 60
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    const n = loadMatchPrefs().bestApm;
    expect(n).toBe(90);
    expect(loadMatchPrefs().avgApm).toBe(60);
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 90 }));
    expect(pauseBestApmTipLine(n)).toBe('Best APM · 90');
    expect(pauseBestApmTipLine(n)).toMatch(/^Best APM \u00b7 /);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(pauseBestApmTipLine(n)).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 90 }));
    expect(pauseBestApmTipLine(n)).not.toBe(pauseAvgApmTipLine(60));
    expect(pauseAvgApmTipLine(60)).toBe(t('pause.avgApmTip', { n: 60 }));
    expect(pauseAvgApmTipLine(60)).toMatch(/^Avg APM \u00b7 /);
    expect(pauseBestApmTipLine(n)).not.toBe(pauseApmTipLine(90, 60_000));
    expect(pauseApmTipLine(90, 60_000)).toBe(t('pause.apmTip', { n: 90 }));
    expect(pauseApmTipLine(90, 60_000)).toMatch(/^APM \u00b7 /);
  });

  it('localizes Best APM middot for pt-BR and es; keys stay pause-scoped', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 60_000, true, 48);
    const n = loadMatchPrefs().bestApm;
    setLocale('pt-BR');
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 48 }));
    expect(pauseBestApmTipLine(n)).toBe('Melhor APM · 48');
    expect(pauseBestApmTipLine(n)).toMatch(/^Melhor APM \u00b7 /);
    expect(pauseBestApmTipLine(n)).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 48 }));
    expect(pauseBestApmTipLine(n)).not.toBe(pauseAvgApmTipLine(48));
    expect(pauseAvgApmTipLine(48)).toBe(t('pause.avgApmTip', { n: 48 }));
    expect(pauseBestApmTipLine(n)).not.toBe(pauseApmTipLine(48, 60_000));
    expect(pauseApmTipLine(48, 60_000)).toBe(t('pause.apmTip', { n: 48 }));
    setLocale('es');
    expect(pauseBestApmTipLine(n)).toBe(t('pause.bestApmTip', { n: 48 }));
    expect(pauseBestApmTipLine(n)).toBe('Mejor APM · 48');
    expect(pauseBestApmTipLine(n)).toMatch(/^Mejor APM \u00b7 /);
    expect(pauseBestApmTipLine(n)).toBe(lobbyBestApmTipLine());
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 48 }));
    expect(pauseBestApmTipLine(n)).not.toBe(pauseAvgApmTipLine(48));
    expect(pauseAvgApmTipLine(48)).toBe(t('pause.avgApmTip', { n: 48 }));
    expect(pauseBestApmTipLine(n)).not.toBe(pauseApmTipLine(48, 60_000));
    setLocale('en-GB');
  });
});
