import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endAvgDurationTipLine } from './endAvgDurationTip';
import { endBestMapTipLine } from './endBestMapTip';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
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

describe('endBestMapTipLine', () => {
  it('returns null before any winning best-duration map', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, false);
    expect(endBestMapTipLine()).toBeNull();
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
    expect(endBestMapTipLine()).toBe(t('end.bestMapTip', { name }));
    expect(endBestMapTipLine()).toBe('Best map · Ridge');
    expect(endBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endBestMapTipLine()).toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(t('lobby.bestMapTip', { name }));
    expect(endBestMapTipLine()).toBe(pauseBestMapTipLine(mapId));
    expect(pauseBestMapTipLine(mapId)).toBe(t('pause.bestMapTip', { name }));
    // Distinct from peer career tips (Avg time · / Best streak · / Record ·).
    expect(endBestMapTipLine()).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toBe(
      t('end.avgDurationTip', {
        clock: formatMatchClock(loadMatchPrefs().avgDurationMs!),
      }),
    );
    expect(endAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(endBestMapTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 3 }),
    );
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    expect(endBestMapTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 3, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 3–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    // Also distinct from this-match Map · tip.
    expect(endBestMapTipLine()).not.toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toMatch(/^Map \u00b7 /);
  });

  it('localizes Best map middot for pt-BR and es; stays distinct from Avg time / Best streak / Record', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, true);
    const mapId = loadMatchPrefs().bestDurationMapId;
    expect(mapId).toBe('gap');

    setLocale('pt-BR');
    expect(endBestMapTipLine()).toBe(
      t('end.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(endBestMapTipLine()).toBe('Melhor mapa · Vão');
    expect(endBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(endBestMapTipLine()).toBe(lobbyBestMapTipLine());
    expect(endBestMapTipLine()).toBe(pauseBestMapTipLine(mapId));
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(pauseBestMapTipLine(mapId)).toBe(
      t('pause.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(endBestMapTipLine()).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(endBestMapTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);
    expect(endBestMapTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);

    setLocale('es');
    expect(endBestMapTipLine()).toBe(
      t('end.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(endBestMapTipLine()).toBe('Mejor mapa · Brecha');
    expect(endBestMapTipLine()).toMatch(/^Mejor mapa \u00b7 /);
    expect(endBestMapTipLine()).toBe(lobbyBestMapTipLine());
    expect(endBestMapTipLine()).toBe(pauseBestMapTipLine(mapId));
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(pauseBestMapTipLine(mapId)).toBe(
      t('pause.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(endBestMapTipLine()).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(endBestMapTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    expect(endBestMapTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    setLocale('en-GB');
  });
});
