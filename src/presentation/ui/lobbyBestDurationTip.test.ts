import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endDurationTipLine } from './endDurationTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyMatchLengthTipLine } from './lobbyPanel';

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

describe('lobbyBestDurationTipLine', () => {
  it('returns null before any winning duration', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, false);
    expect(lobbyBestDurationTipLine()).toBeNull();
  });

  it('labels Best · mm:ss with middot, distinct from Last · / Avg time · / Time · / Best map ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 125_000, true);
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(125_000) }),
    );
    rememberMatchPrefs('brutes', 'easy', 'ridge', 90_000, true);
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    rememberMatchPrefs('nobles', 'normal', 'gap', 200_000, true);
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, false);
    const bestClock = formatMatchClock(90_000);
    const line = lobbyBestDurationTipLine();
    expect(line).toBe(
      t('lobby.bestDurationTip', { clock: bestClock }),
    );
    expect(line).toBe('Best · 1:30');
    expect(line).toMatch(/^Best \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    expect(line).toContain(bestClock);
    // Distinct from peer duration tips (Last · / Avg time · / Time · / ~min).
    expect(line).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(60_000) }),
    );
    expect(lobbyLastDurationTipLine()).toBe('Last · 1:00');
    expect(lobbyLastDurationTipLine()).toMatch(/^Last \u00b7 /);
    expect(line).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(line).not.toBe(endDurationTipLine(90_000));
    expect(endDurationTipLine(90_000)).toBe(
      t('end.durationTip', { clock: bestClock }),
    );
    expect(endDurationTipLine(90_000)).toBe('Time · 1:30');
    expect(endDurationTipLine(90_000)).toMatch(/^Time \u00b7 /);
    expect(line).not.toBe(lobbyMatchLengthTipLine());
    // Distinct from same-prefix Best map · peer.
    expect(line).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    expect(line).not.toMatch(/^Last \u00b7 /);
    expect(line).not.toMatch(/^Avg time \u00b7 /);
    expect(line).not.toMatch(/^Time \u00b7 /);
    expect(line).not.toMatch(/^Best map \u00b7 /);
  });

  it('keeps best when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(80_000) }),
    );
    expect(lobbyBestDurationTipLine()).toBe('Best · 1:20');
    expect(lobbyBestDurationTipLine()).toMatch(/^Best \u00b7 /);
  });

  it('localizes Best · mm:ss middot for pt-BR and es; stays distinct from Last / Avg / Time / Best map', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 125_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'gap', 200_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, false);
    const bestClock = formatMatchClock(90_000);

    setLocale('pt-BR');
    const pt = lobbyBestDurationTipLine();
    expect(pt).toBe(t('lobby.bestDurationTip', { clock: bestClock }));
    expect(pt).toBe('Melhor · 1:30');
    expect(pt).toMatch(/^Melhor \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(60_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(pt).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toBe(endDurationTipLine(90_000));
    expect(endDurationTipLine(90_000)).toMatch(/^Tempo \u00b7 /);
    expect(pt).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toMatch(/^Última \u00b7 /);
    expect(pt).not.toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^Tempo \u00b7 /);
    expect(pt).not.toMatch(/^Melhor mapa \u00b7 /);

    setLocale('es');
    const es = lobbyBestDurationTipLine();
    expect(es).toBe(t('lobby.bestDurationTip', { clock: bestClock }));
    expect(es).toBe('Mejor · 1:30');
    expect(es).toMatch(/^Mejor \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(60_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(es).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toBe(endDurationTipLine(90_000));
    expect(endDurationTipLine(90_000)).toMatch(/^Tiempo \u00b7 /);
    expect(es).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toMatch(/^Última \u00b7 /);
    expect(es).not.toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^Tiempo \u00b7 /);
    expect(es).not.toMatch(/^Mejor mapa \u00b7 /);
    setLocale('en-GB');
  });
});
