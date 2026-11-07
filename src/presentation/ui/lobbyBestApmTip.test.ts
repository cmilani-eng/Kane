import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { lobbyAvgApmTipLine } from './lobbyAvgApmTip';
import { lobbyBestApmTipLine } from './lobbyBestApmTip';
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

describe('lobbyBestApmTipLine', () => {
  it('returns null before any finished match with actions', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyBestApmTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(lobbyBestApmTipLine()).toBeNull();
  });

  it('labels Best APM · n from career peak, distinct from Avg APM · and APM ·', () => {
    // 90 APM then 30 APM → peak 90; avg 60
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    expect(loadMatchPrefs().bestApm).toBe(90);
    expect(loadMatchPrefs().avgApm).toBe(60);
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 90 }));
    expect(lobbyBestApmTipLine()).toBe('Best APM · 90');
    expect(lobbyBestApmTipLine()).toMatch(/^Best APM \u00b7 /);
    expect(lobbyAvgApmTipLine()).toBe('Avg APM · 60');
    expect(lobbyAvgApmTipLine()).toMatch(/^Avg APM \u00b7 /);
    expect(lobbyBestApmTipLine()).not.toBe(lobbyAvgApmTipLine());
    expect(lobbyBestApmTipLine()).not.toBe(endApmTipLine(90, 60_000));
    expect(lobbyBestApmTipLine()).not.toBe(pauseApmTipLine(90, 60_000));
    expect(endApmTipLine(90, 60_000)).toBe(t('end.apmTip', { n: 90 }));
    expect(pauseApmTipLine(90, 60_000)).toBe(t('pause.apmTip', { n: 90 }));
    expect(endApmTipLine(90, 60_000)).toMatch(/^APM ·/);
    expect(pauseApmTipLine(90, 60_000)).toMatch(/^APM ·/);
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

  it('localizes Best APM middot for pt-BR and es; keys stay lobby-scoped', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 60_000, true, 48);
    setLocale('pt-BR');
    expect(lobbyBestApmTipLine()).toBe('Melhor APM · 48');
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 48 }));
    expect(lobbyBestApmTipLine()).not.toBe(lobbyAvgApmTipLine());
    expect(lobbyBestApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    expect(lobbyBestApmTipLine()).not.toBe(pauseApmTipLine(48, 60_000));
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 48 }));
    expect(endApmTipLine(48, 60_000)).toBe(t('end.apmTip', { n: 48 }));
    expect(pauseApmTipLine(48, 60_000)).toBe(t('pause.apmTip', { n: 48 }));
    setLocale('es');
    expect(lobbyBestApmTipLine()).toBe('Mejor APM · 48');
    expect(lobbyBestApmTipLine()).toBe(t('lobby.bestApmTip', { n: 48 }));
    expect(lobbyBestApmTipLine()).not.toBe(lobbyAvgApmTipLine());
    expect(lobbyBestApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    expect(lobbyBestApmTipLine()).not.toBe(pauseApmTipLine(48, 60_000));
  });
});
