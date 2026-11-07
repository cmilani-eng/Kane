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

describe('endAvgDurationTipLine', () => {
  it('is null when avg duration is missing or not positive', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endAvgDurationTipLine()).toBeNull();
  });

  it('labels Avg time · mm:ss with middot, distinct from Last · / Best · / Time · / length', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    const avgMs = loadMatchPrefs().avgDurationMs;
    expect(avgMs).toBe(120_000);
    expect(loadMatchPrefs().avgDurationSamples).toBe(2);
    const avgClock = formatMatchClock(120_000);
    const line = endAvgDurationTipLine();
    expect(line).toBe(t('end.avgDurationTip', { clock: avgClock }));
    expect(line).toBe('Avg time · 2:00');
    expect(line).toMatch(/^Avg time \u00b7 /);
    expect(line).toContain(avgClock);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(line).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: avgClock }),
    );
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

  it('localizes Avg time middot for pt-BR and es; stays distinct from Last / Best / Time', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    const avgMs = loadMatchPrefs().avgDurationMs;
    const avgClock = formatMatchClock(120_000);

    setLocale('pt-BR');
    const pt = endAvgDurationTipLine();
    expect(pt).toBe(t('end.avgDurationTip', { clock: avgClock }));
    expect(pt).toBe('Tempo médio · 2:00');
    expect(pt).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: avgClock }),
    );
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
    const es = endAvgDurationTipLine();
    expect(es).toBe(t('end.avgDurationTip', { clock: avgClock }));
    expect(es).toBe('Tiempo medio · 2:00');
    expect(es).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: avgClock }),
    );
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
