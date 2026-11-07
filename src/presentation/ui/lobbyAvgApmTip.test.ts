import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { lobbyAvgApmTipLine } from './lobbyAvgApmTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
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

describe('lobbyAvgApmTipLine', () => {
  it('returns null before any finished match with actions', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyAvgApmTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(lobbyAvgApmTipLine()).toBeNull();
  });

  it('labels Avg APM · n from career prefs, distinct from end/pause APM', () => {
    // 120 actions / 1 min = 120 APM; 60 actions / 2 min = 30 APM → avg 75
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 120);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 120_000, false, 60);
    expect(loadMatchPrefs().avgApm).toBe(75);
    expect(loadMatchPrefs().avgApmSamples).toBe(2);
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 75 }));
    expect(lobbyAvgApmTipLine()).toBe('Avg APM · 75');
    expect(lobbyAvgApmTipLine()).toMatch(/^Avg APM \u00b7 /);
    expect(lobbyAvgApmTipLine()).not.toBe(endApmTipLine(120, 60_000));
    expect(lobbyAvgApmTipLine()).not.toBe(pauseApmTipLine(120, 60_000));
    expect(endApmTipLine(120, 60_000)).toBe(t('end.apmTip', { n: 120 }));
    expect(pauseApmTipLine(120, 60_000)).toBe(t('pause.apmTip', { n: 120 }));
    expect(endApmTipLine(120, 60_000)).toMatch(/^APM ·/);
    expect(pauseApmTipLine(120, 60_000)).toMatch(/^APM ·/);
    expect(lobbyAvgApmTipLine()).not.toBe(lobbyAvgDurationTipLine());
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

  it('localizes Avg APM middot for pt-BR and es; keys stay lobby-scoped', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 60_000, true, 48);
    setLocale('pt-BR');
    expect(lobbyAvgApmTipLine()).toBe('APM médio · 48');
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 48 }));
    expect(lobbyAvgApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    expect(lobbyAvgApmTipLine()).not.toBe(pauseApmTipLine(48, 60_000));
    expect(endApmTipLine(48, 60_000)).toBe(t('end.apmTip', { n: 48 }));
    expect(pauseApmTipLine(48, 60_000)).toBe(t('pause.apmTip', { n: 48 }));
    setLocale('es');
    expect(lobbyAvgApmTipLine()).toBe('APM medio · 48');
    expect(lobbyAvgApmTipLine()).toBe(t('lobby.avgApmTip', { n: 48 }));
    expect(lobbyAvgApmTipLine()).not.toBe(endApmTipLine(48, 60_000));
    expect(lobbyAvgApmTipLine()).not.toBe(pauseApmTipLine(48, 60_000));
  });
});
