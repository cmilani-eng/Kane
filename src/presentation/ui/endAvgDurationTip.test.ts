import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endAvgDurationTipLine } from './endAvgDurationTip';
import { endDurationTipLine } from './endDurationTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { pauseAvgDurationTipLine } from './pauseAvgDurationTip';

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

describe('endAvgDurationTipLine', () => {
  it('is null when avg duration is missing or not positive', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endAvgDurationTipLine()).toBeNull();
  });

  it('labels Avg time · mm:ss from career prefs, distinct from lobby/pause avg and match Time ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    const avgMs = loadMatchPrefs().avgDurationMs;
    expect(avgMs).toBe(120_000);
    const clock = formatMatchClock(120_000);
    expect(endAvgDurationTipLine()).toBe(t('end.avgDurationTip', { clock }));
    expect(endAvgDurationTipLine()).toBe('Avg time · 2:00');
    expect(endAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(endAvgDurationTipLine()).toContain(clock);
    // Same en copy as lobby/pause tip; distinct i18n key / surface.
    expect(endAvgDurationTipLine()).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock }),
    );
    expect(endAvgDurationTipLine()).toBe(pauseAvgDurationTipLine(avgMs));
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock }),
    );
    expect(endAvgDurationTipLine()).not.toBe(endDurationTipLine(120_000));
    expect(endDurationTipLine(120_000)).toBe(
      t('end.durationTip', { clock }),
    );
    expect(endDurationTipLine(120_000)).toMatch(/^Time \u00b7 /);
  });

  it('localizes Avg time middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, true);
    const avgMs = loadMatchPrefs().avgDurationMs;
    const clock = formatMatchClock(75_000);
    setLocale('pt-BR');
    expect(endAvgDurationTipLine()).toBe(t('end.avgDurationTip', { clock }));
    expect(endAvgDurationTipLine()).toBe('Tempo médio · 1:15');
    expect(endAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(endAvgDurationTipLine()).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock }),
    );
    expect(endAvgDurationTipLine()).toBe(pauseAvgDurationTipLine(avgMs));
    expect(endAvgDurationTipLine()).not.toBe(endDurationTipLine(75_000));
    setLocale('es');
    expect(endAvgDurationTipLine()).toBe(t('end.avgDurationTip', { clock }));
    expect(endAvgDurationTipLine()).toBe('Tiempo medio · 1:15');
    expect(endAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(endAvgDurationTipLine()).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock }),
    );
    expect(endAvgDurationTipLine()).toBe(pauseAvgDurationTipLine(avgMs));
    expect(endAvgDurationTipLine()).not.toBe(endDurationTipLine(75_000));
    setLocale('en-GB');
  });
});
