import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { pauseAvgDurationTipLine } from './pauseAvgDurationTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

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

describe('pauseAvgDurationTipLine', () => {
  it('is null when avg duration is missing or not positive', () => {
    expect(pauseAvgDurationTipLine(undefined)).toBeNull();
    expect(pauseAvgDurationTipLine(null)).toBeNull();
    expect(pauseAvgDurationTipLine(0)).toBeNull();
    expect(pauseAvgDurationTipLine(-1)).toBeNull();
  });

  it('labels Avg time · mm:ss from career prefs, distinct from lobby avg / match clock', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    const avgMs = loadMatchPrefs().avgDurationMs;
    expect(avgMs).toBe(120_000);
    const clock = formatMatchClock(120_000);
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock }),
    );
    expect(pauseAvgDurationTipLine(avgMs)).toBe('Avg time · 2:00');
    expect(pauseAvgDurationTipLine(avgMs)).toMatch(/^Avg time \u00b7 /);
    expect(pauseAvgDurationTipLine(avgMs)).toContain(clock);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(pauseAvgDurationTipLine(avgMs)).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock }),
    );
    expect(pauseAvgDurationTipLine(avgMs)).not.toBe(
      pauseMatchClockTipLine(120_000),
    );
    expect(pauseMatchClockTipLine(120_000)).toBe(
      t('pause.clockTip', { clock }),
    );
    expect(pauseMatchClockTipLine(120_000)).toMatch(/^Time \u00b7 /);
  });

  it('localizes Avg time middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, true);
    const avgMs = loadMatchPrefs().avgDurationMs;
    const clock = formatMatchClock(75_000);
    setLocale('pt-BR');
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock }),
    );
    expect(pauseAvgDurationTipLine(avgMs)).toBe('Tempo médio · 1:15');
    expect(pauseAvgDurationTipLine(avgMs)).toMatch(/^Tempo médio \u00b7 /);
    expect(pauseAvgDurationTipLine(avgMs)).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock }),
    );
    expect(pauseAvgDurationTipLine(avgMs)).not.toBe(
      pauseMatchClockTipLine(75_000),
    );
    setLocale('es');
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock }),
    );
    expect(pauseAvgDurationTipLine(avgMs)).toBe('Tiempo medio · 1:15');
    expect(pauseAvgDurationTipLine(avgMs)).toMatch(/^Tiempo medio \u00b7 /);
    expect(pauseAvgDurationTipLine(avgMs)).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock }),
    );
    expect(pauseAvgDurationTipLine(avgMs)).not.toBe(
      pauseMatchClockTipLine(75_000),
    );
    setLocale('en-GB');
  });
});
