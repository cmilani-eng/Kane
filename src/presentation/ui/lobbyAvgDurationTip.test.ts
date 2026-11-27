import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endAvgDurationTipLine } from './endAvgDurationTip';
import { endDurationTipLine } from './endDurationTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyMatchLengthTipLine } from './lobbyPanel';
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

describe('lobbyAvgDurationTipLine', () => {
  it('returns null before any finished match with duration', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyAvgDurationTipLine()).toBeNull();
  });

  it('labels Avg time · mm:ss with middot, distinct from Last · / Best · / Time · / length', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    const avgMs = loadMatchPrefs().avgDurationMs;
    expect(avgMs).toBe(120_000);
    expect(loadMatchPrefs().avgDurationSamples).toBe(2);
    const avgClock = formatMatchClock(120_000);
    const line = lobbyAvgDurationTipLine();
    expect(line).toBe(t('lobby.avgDurationTip', { clock: avgClock }));
    expect(line).toBe('Avg time · 2:00');
    expect(line).toMatch(/^Avg time \u00b7 /);
    expect(line).toContain(avgClock);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(line).toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toBe(t('end.avgDurationTip', { clock: avgClock }));
    expect(line).toBe(pauseAvgDurationTipLine(avgMs));
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock: avgClock }),
    );
    // Distinct from peer duration tips (Last · / Best · / Time · / ~min).
    expect(line).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(150_000) }),
    );
    expect(lobbyLastDurationTipLine()).toBe('Last · 2:30');
    expect(lobbyLastDurationTipLine()).toMatch(/^Last \u00b7 /);
    expect(line).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyBestDurationTipLine()).toBe('Best · 1:30');
    expect(lobbyBestDurationTipLine()).toMatch(/^Best \u00b7 /);
    expect(line).not.toBe(lobbyMatchLengthTipLine());
    expect(line).not.toBe(endDurationTipLine(120_000));
    expect(endDurationTipLine(120_000)).toBe(
      t('end.durationTip', { clock: avgClock }),
    );
    expect(endDurationTipLine(120_000)).toMatch(/^Time \u00b7 /);
    expect(line).not.toMatch(/^Last \u00b7 /);
    expect(line).not.toMatch(/^Best \u00b7 /);
    expect(line).not.toMatch(/^Time \u00b7 /);
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

  it('localizes Avg time middot for pt-BR and es; stays distinct from Last / Best / Time', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    const avgMs = loadMatchPrefs().avgDurationMs;
    const avgClock = formatMatchClock(120_000);

    setLocale('pt-BR');
    const pt = lobbyAvgDurationTipLine();
    expect(pt).toBe(t('lobby.avgDurationTip', { clock: avgClock }));
    expect(pt).toBe('Tempo médio · 2:00');
    expect(pt).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toBe(t('end.avgDurationTip', { clock: avgClock }));
    expect(pt).toBe(pauseAvgDurationTipLine(avgMs));
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock: avgClock }),
    );
    expect(pt).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(150_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(pt).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyBestDurationTipLine()).toMatch(/^Melhor \u00b7 /);
    expect(pt).not.toBe(endDurationTipLine(120_000));
    expect(endDurationTipLine(120_000)).toMatch(/^Tempo \u00b7 /);
    expect(pt).not.toMatch(/^Última \u00b7 /);
    expect(pt).not.toMatch(/^Melhor \u00b7 /);
    expect(pt).not.toMatch(/^Tempo \u00b7 /);

    setLocale('es');
    const es = lobbyAvgDurationTipLine();
    expect(es).toBe(t('lobby.avgDurationTip', { clock: avgClock }));
    expect(es).toBe('Tiempo medio · 2:00');
    expect(es).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toBe(t('end.avgDurationTip', { clock: avgClock }));
    expect(es).toBe(pauseAvgDurationTipLine(avgMs));
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock: avgClock }),
    );
    expect(es).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(150_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(es).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyBestDurationTipLine()).toMatch(/^Mejor \u00b7 /);
    expect(es).not.toBe(endDurationTipLine(120_000));
    expect(endDurationTipLine(120_000)).toMatch(/^Tiempo \u00b7 /);
    expect(es).not.toMatch(/^Última \u00b7 /);
    expect(es).not.toMatch(/^Mejor \u00b7 /);
    expect(es).not.toMatch(/^Tiempo \u00b7 /);
    setLocale('en-GB');
  });
});
