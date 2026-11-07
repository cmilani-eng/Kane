import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endMapSizeTipLine } from './endMapSizeTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyLastMapSizeTipLine } from './lobbyLastMapSizeTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';
import { lobbyMapTipLine } from './lobbyPanel';
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

describe('lobbyLastMapSizeTipLine', () => {
  it('labels Map · w×h with middot, distinct from Last map · / Best map · / Map · name / blurb', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    rememberMatchPrefs('brutes', 'hard', 'gap', 200_000, false);

    const size = `${MAP.width}×${MAP.height}`;
    const tip = lobbyLastMapSizeTipLine();
    expect(tip).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(tip).toBe(`Map · ${size}`);
    expect(tip).toBe('Map · 2400×1600');
    expect(tip).toMatch(/^Map \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(size);
    expect(tip).toMatch(/×/);

    // Same en copy as end Map · w×h; distinct i18n key / surface.
    expect(tip).toBe(endMapSizeTipLine('gap'));
    expect(endMapSizeTipLine('gap')).toBe(
      t('end.mapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(endMapSizeTipLine('gap')).toBe('Map · 2400×1600');
    expect(endMapSizeTipLine('gap')).toMatch(/^Map \u00b7 /);
    expect(t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height })).toBe(
      t('end.mapSizeTip', { w: MAP.width, h: MAP.height }),
    );

    // Distinct from Last map · / Best map · / selected blurb.
    expect(tip).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Last map · Gap');
    expect(lobbyLastMapTipLine()).toMatch(/^Last map \u00b7 /);
    expect(tip).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe('Best map · Ridge');
    expect(lobbyBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    expect(tip).not.toBe(lobbyMapTipLine());
    expect(lobbyMapTipLine()).toMatch(/ \u00b7 /);
    expect(lobbyMapTipLine()).toContain(mapCopy('gap').label);

    // Distinct from same-prefix Map · name peers (pause / end).
    expect(tip).not.toBe(pauseMapTipLine('gap'));
    expect(pauseMapTipLine('gap')).toBe('Map · Gap');
    expect(pauseMapTipLine('gap')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toBe(endMapPlayedTipLine('gap'));
    expect(endMapPlayedTipLine('gap')).toBe('Map · Gap');
    expect(endMapPlayedTipLine('gap')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toMatch(/^Last map \u00b7 /);
    expect(tip).not.toMatch(/^Best map \u00b7 /);
  });

  it('stays Map · w×h when remembered map changes (shared MAP bounds)', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLastMapSizeTipLine()).toBe('Map · 2400×1600');
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Map \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'ridge');
    expect(lobbyLastMapSizeTipLine()).toBe('Map · 2400×1600');
    expect(lobbyLastMapSizeTipLine()).toBe(endMapSizeTipLine('ridge'));
    expect(lobbyLastMapSizeTipLine()).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Last map · Ridge');
  });

  it('localizes Map · w×h middot for pt-BR and es; stays distinct from Last map / Best map / Map name / blurb', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    rememberMatchPrefs('brutes', 'hard', 'gap', 200_000, false);

    setLocale('pt-BR');
    const pt = lobbyLastMapSizeTipLine();
    expect(pt).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(pt).toBe('Mapa · 2400×1600');
    expect(pt).toMatch(/^Mapa \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).toBe(endMapSizeTipLine('gap'));
    expect(endMapSizeTipLine('gap')).toBe(
      t('end.mapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(endMapSizeTipLine('gap')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Vão');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe('Melhor mapa · Cume');
    expect(lobbyBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toBe(lobbyMapTipLine());
    expect(lobbyMapTipLine()).toContain(mapCopy('gap').label);
    expect(pt).not.toBe(pauseMapTipLine('gap'));
    expect(pauseMapTipLine('gap')).toBe('Mapa · Vão');
    expect(pauseMapTipLine('gap')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(endMapPlayedTipLine('gap'));
    expect(endMapPlayedTipLine('gap')).toBe('Mapa · Vão');

    setLocale('es');
    const es = lobbyLastMapSizeTipLine();
    expect(es).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(es).toBe('Mapa · 2400×1600');
    expect(es).toMatch(/^Mapa \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).toBe(endMapSizeTipLine('gap'));
    expect(endMapSizeTipLine('gap')).toBe(
      t('end.mapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(endMapSizeTipLine('gap')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Brecha');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe('Mejor mapa · Cresta');
    expect(lobbyBestMapTipLine()).toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toBe(lobbyMapTipLine());
    expect(lobbyMapTipLine()).toContain(mapCopy('gap').label);
    expect(es).not.toBe(pauseMapTipLine('gap'));
    expect(pauseMapTipLine('gap')).toBe('Mapa · Brecha');
    expect(pauseMapTipLine('gap')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(endMapPlayedTipLine('gap'));
    expect(es).not.toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toMatch(/^Mejor mapa \u00b7 /);
    setLocale('en-GB');
  });
});
