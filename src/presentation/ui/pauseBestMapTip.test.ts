import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { pauseAvgDurationTipLine } from './pauseAvgDurationTip';
import { pauseBestMapTipLine } from './pauseBestMapTip';
import { pauseBestWinStreakTipLine } from './pauseBestWinStreakTip';
import { pauseMapTipLine } from './pauseMapTip';

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

describe('pauseBestMapTipLine', () => {
  it('is null when best-duration map id is missing', () => {
    expect(pauseBestMapTipLine(undefined)).toBeNull();
    expect(pauseBestMapTipLine(null)).toBeNull();
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, false);
    expect(pauseBestMapTipLine(loadMatchPrefs().bestDurationMapId)).toBeNull();
  });

  it('labels Best map · name with middot, distinct from Avg time · / Best streak · / Record ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 125_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'gap', 200_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, false);
    const mapId = loadMatchPrefs().bestDurationMapId;
    expect(mapId).toBe('ridge');
    const name = mapCopy('ridge').label;
    expect(pauseBestMapTipLine(mapId)).toBe(t('pause.bestMapTip', { name }));
    expect(pauseBestMapTipLine(mapId)).toBe('Best map · Ridge');
    expect(pauseBestMapTipLine(mapId)).toMatch(/^Best map \u00b7 /);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(pauseBestMapTipLine(mapId)).toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(t('lobby.bestMapTip', { name }));
    // Distinct from peer career tips (Avg time · / Best streak · / Record ·).
    const avgMs = loadMatchPrefs().avgDurationMs;
    expect(pauseBestMapTipLine(mapId)).not.toBe(pauseAvgDurationTipLine(avgMs));
    expect(pauseAvgDurationTipLine(avgMs)).toBe(
      t('pause.avgDurationTip', { clock: formatMatchClock(avgMs!) }),
    );
    expect(pauseAvgDurationTipLine(avgMs)).toMatch(/^Avg time \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).not.toBe(pauseBestWinStreakTipLine(1));
    expect(pauseBestWinStreakTipLine(1)).toBe(
      t('pause.bestWinStreakTip', { n: 1 }),
    );
    expect(pauseBestWinStreakTipLine(1)).toMatch(/^Best streak \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 3, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 3–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    // Also distinct from current-match Map · tip.
    expect(pauseBestMapTipLine(mapId)).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toMatch(/^Map \u00b7 /);
  });

  it('localizes Best map middot for pt-BR and es; stays distinct from Avg time / Best streak / Record', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, true);
    const mapId = loadMatchPrefs().bestDurationMapId;
    expect(mapId).toBe('gap');
    const avgMs = loadMatchPrefs().avgDurationMs;

    setLocale('pt-BR');
    expect(pauseBestMapTipLine(mapId)).toBe(
      t('pause.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(pauseBestMapTipLine(mapId)).toBe('Melhor mapa · Vão');
    expect(pauseBestMapTipLine(mapId)).toMatch(/^Melhor mapa \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(pauseBestMapTipLine(mapId)).not.toBe(pauseAvgDurationTipLine(avgMs));
    expect(pauseAvgDurationTipLine(avgMs)).toMatch(/^Tempo médio \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).not.toBe(pauseBestWinStreakTipLine(1));
    expect(pauseBestWinStreakTipLine(1)).toMatch(/^Melhor sequência \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);

    setLocale('es');
    expect(pauseBestMapTipLine(mapId)).toBe(
      t('pause.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(pauseBestMapTipLine(mapId)).toBe('Mejor mapa · Brecha');
    expect(pauseBestMapTipLine(mapId)).toMatch(/^Mejor mapa \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(pauseBestMapTipLine(mapId)).not.toBe(pauseAvgDurationTipLine(avgMs));
    expect(pauseAvgDurationTipLine(avgMs)).toMatch(/^Tiempo medio \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).not.toBe(pauseBestWinStreakTipLine(1));
    expect(pauseBestWinStreakTipLine(1)).toMatch(/^Mejor racha \u00b7 /);
    expect(pauseBestMapTipLine(mapId)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 1, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    setLocale('en-GB');
  });
});
