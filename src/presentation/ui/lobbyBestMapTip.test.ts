import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { pauseBestMapTipLine } from './pauseBestMapTip';

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

describe('lobbyBestMapTipLine', () => {
  it('returns null before any winning best-duration map', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, false);
    expect(lobbyBestMapTipLine()).toBeNull();
    expect(loadMatchPrefs().bestDurationMapId).toBeUndefined();
  });

  it('labels Best map · name with middot, distinct from Avg time · / Best streak · / Record ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 125_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'gap', 200_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, false);
    const mapId = loadMatchPrefs().bestDurationMapId;
    expect(mapId).toBe('ridge');
    const name = mapCopy('ridge').label;
    expect(lobbyBestMapTipLine()).toBe(t('lobby.bestMapTip', { name }));
    expect(lobbyBestMapTipLine()).toBe('Best map · Ridge');
    expect(lobbyBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(lobbyBestMapTipLine()).toBe(pauseBestMapTipLine(mapId));
    expect(pauseBestMapTipLine(mapId)).toBe(t('pause.bestMapTip', { name }));
    // Distinct from peer career tips (Avg time · / Best streak · / Record ·).
    expect(lobbyBestMapTipLine()).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', {
        clock: formatMatchClock(loadMatchPrefs().avgDurationMs!),
      }),
    );
    expect(lobbyAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 3 }),
    );
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 3, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 3–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    // Also distinct from Last map · / Best · clock.
    expect(lobbyBestMapTipLine()).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toMatch(/^Last map \u00b7 /);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyBestDurationTipLine()).toMatch(/^Best \u00b7 /);
  });

  it('localizes Best map middot for pt-BR and es; stays distinct from Avg time / Best streak / Record', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, true);
    const mapId = loadMatchPrefs().bestDurationMapId;
    expect(mapId).toBe('gap');

    setLocale('pt-BR');
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(lobbyBestMapTipLine()).toBe('Melhor mapa · Vão');
    expect(lobbyBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(lobbyBestMapTipLine()).toBe(pauseBestMapTipLine(mapId));
    expect(pauseBestMapTipLine(mapId)).toBe(
      t('pause.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(lobbyBestMapTipLine()).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);

    setLocale('es');
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(lobbyBestMapTipLine()).toBe('Mejor mapa · Brecha');
    expect(lobbyBestMapTipLine()).toMatch(/^Mejor mapa \u00b7 /);
    expect(lobbyBestMapTipLine()).toBe(pauseBestMapTipLine(mapId));
    expect(pauseBestMapTipLine(mapId)).toBe(
      t('pause.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(lobbyBestMapTipLine()).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    setLocale('en-GB');
  });

  it('keeps best map when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('crossing').label }),
    );
    expect(lobbyBestMapTipLine()).toBe('Best map · Crossing');
    expect(lobbyBestMapTipLine()).toMatch(/^Best map \u00b7 /);
  });
});
