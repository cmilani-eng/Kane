import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyMatchLengthTipLine } from './lobbyPanel';
import { endDurationTipLine } from './endDurationTip';

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

describe('lobbyAvgDurationTipLine', () => {
  it('returns null before any finished match with duration', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyAvgDurationTipLine()).toBeNull();
  });

  it('labels Avg time · mm:ss from career prefs, distinct from Last/Best/length/end', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    const avgClock = formatMatchClock(120_000);
    expect(loadMatchPrefs().avgDurationMs).toBe(120_000);
    expect(loadMatchPrefs().avgDurationSamples).toBe(2);
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: avgClock }),
    );
    expect(lobbyAvgDurationTipLine()).toMatch(/^Avg time \u00b7/);
    expect(lobbyAvgDurationTipLine()).toContain(avgClock);
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(150_000) }),
    );
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyAvgDurationTipLine()).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyAvgDurationTipLine()).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyAvgDurationTipLine()).not.toBe(lobbyMatchLengthTipLine());
    expect(lobbyAvgDurationTipLine()).not.toBe(endDurationTipLine(120_000));
  });

  it('ignores duration-only remembers and keeps average when outcome omitted', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge', 100_000, true);
    rememberMatchPrefs('nobles', 'easy', 'gap', 200_000);
    expect(loadMatchPrefs().avgDurationMs).toBe(100_000);
    expect(loadMatchPrefs().avgDurationSamples).toBe(1);
    rememberMatchPrefs('weirdos', 'hard', 'crossing');
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: formatMatchClock(100_000) }),
    );
  });

  it('localizes Avg time middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, true);
    setLocale('pt-BR');
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: formatMatchClock(75_000) }),
    );
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tempo médio ·/);
    setLocale('es');
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: formatMatchClock(75_000) }),
    );
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tiempo medio ·/);
  });
});
