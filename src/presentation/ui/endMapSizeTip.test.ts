import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { endBestMapTipLine } from './endBestMapTip';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endMapSizeTipLine } from './endMapSizeTip';
import { lobbyLastMapSizeTipLine } from './lobbyLastMapSizeTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';
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

describe('endMapSizeTipLine', () => {
  it('labels Map · w×h with middot, distinct from Map · name / Best map · / Last map · / lobby Map · size / Size · footprint', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    const size = `${MAP.width}×${MAP.height}`;
    const tip = endMapSizeTipLine('ridge');
    expect(tip).toBe(t('end.mapSizeTip', { w: MAP.width, h: MAP.height }));
    expect(tip).toBe(`Map · ${size}`);
    expect(tip).toBe('Map · 2400×1600');
    expect(tip).toMatch(/^Map \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(size);
    expect(tip).toMatch(/×/);

    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(tip).toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(lobbyLastMapSizeTipLine()).toBe('Map · 2400×1600');
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Map \u00b7 /);
    expect(t('end.mapSizeTip', { w: MAP.width, h: MAP.height })).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );

    // Distinct from same-prefix Map · name peers (end / pause).
    expect(tip).not.toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toBe('Map · Ridge');
    expect(endMapPlayedTipLine('ridge')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toBe('Map · Ridge');
    expect(pauseMapTipLine('ridge')).toMatch(/^Map \u00b7 /);

    // Distinct from Best map · / Last map · career peers.
    expect(tip).not.toBe(endBestMapTipLine());
    expect(endBestMapTipLine()).toBe('Best map · Ridge');
    expect(endBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    expect(tip).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Last map · Ridge');
    expect(lobbyLastMapTipLine()).toMatch(/^Last map \u00b7 /);

    // Distinct from selection Size · w×h footprint (same × framing, different label).
    expect(tip).not.toBe(
      t('sel.footprintTip', { w: MAP.width, h: MAP.height }),
    );
    expect(t('sel.footprintTip', { w: MAP.width, h: MAP.height })).toBe(
      `Size · ${size}`,
    );
    expect(t('sel.footprintTip', { w: MAP.width, h: MAP.height })).toMatch(
      /^Size \u00b7 /,
    );

    expect(tip).not.toMatch(/^Best map \u00b7 /);
    expect(tip).not.toMatch(/^Last map \u00b7 /);
    expect(tip).not.toMatch(/^Size \u00b7 /);
    expect(tip).not.toContain(mapCopy('ridge').label);
  });

  it('stays Map · w×h for any skirmish mapId (shared MAP bounds)', () => {
    expect(endMapSizeTipLine('crossing')).toBe('Map · 2400×1600');
    expect(endMapSizeTipLine('crossing')).toMatch(/^Map \u00b7 /);
    expect(endMapSizeTipLine('ridge')).toBe('Map · 2400×1600');
    expect(endMapSizeTipLine('gap')).toBe('Map · 2400×1600');
    expect(endMapSizeTipLine('ridge')).toBe(endMapSizeTipLine('gap'));
    expect(endMapSizeTipLine('ridge')).not.toBe(endMapPlayedTipLine('ridge'));
  });

  it('localizes Map · w×h middot for pt-BR and es; stays distinct from Map name / Best map / Last map / lobby size / Size ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const pt = endMapSizeTipLine('ridge');
    expect(pt).toBe(t('end.mapSizeTip', { w: MAP.width, h: MAP.height }));
    expect(pt).toBe('Mapa · 2400×1600');
    expect(pt).toMatch(/^Mapa \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toBe('Mapa · Cume');
    expect(endMapPlayedTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toBe('Mapa · Cume');
    expect(pt).not.toBe(endBestMapTipLine());
    expect(endBestMapTipLine()).toBe('Melhor mapa · Cume');
    expect(endBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Cume');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toBe(
      t('sel.footprintTip', { w: MAP.width, h: MAP.height }),
    );
    expect(t('sel.footprintTip', { w: MAP.width, h: MAP.height })).toMatch(
      /^Tamanho \u00b7 /,
    );
    expect(pt).not.toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toContain(mapCopy('ridge').label);

    setLocale('es');
    const es = endMapSizeTipLine('ridge');
    expect(es).toBe(t('end.mapSizeTip', { w: MAP.width, h: MAP.height }));
    expect(es).toBe('Mapa · 2400×1600');
    expect(es).toMatch(/^Mapa \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toBe('Mapa · Cresta');
    expect(endMapPlayedTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toBe('Mapa · Cresta');
    expect(es).not.toBe(endBestMapTipLine());
    expect(endBestMapTipLine()).toBe('Mejor mapa · Cresta');
    expect(endBestMapTipLine()).toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Cresta');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toBe(
      t('sel.footprintTip', { w: MAP.width, h: MAP.height }),
    );
    expect(t('sel.footprintTip', { w: MAP.width, h: MAP.height })).toMatch(
      /^Tamaño \u00b7 /,
    );
    expect(es).not.toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toContain(mapCopy('ridge').label);
    setLocale('en-GB');
  });
});
