import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endMapSizeTipLine } from './endMapSizeTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';
import { pauseBestMapTipLine } from './pauseBestMapTip';
import { pauseMapTipLine } from './pauseMapTip';
import { pauseSelectedSectorTipLine } from './pauseSelectedSectorTip';
import { pauseSpeciesMottoTipLine } from './pauseSpeciesMottoTip';

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

describe('pauseMapTipLine', () => {
  it('labels Map · name with middot, distinct from Best map · / Map · size / Last map · / Focus · / motto', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 90_000, true);
    const name = mapCopy('ridge').label;
    const tip = pauseMapTipLine('ridge');
    expect(tip).toBe(t('pause.map', { name }));
    expect(tip).toBe('Map · Ridge');
    expect(tip).toMatch(/^Map \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(name);

    // Same en copy as end tip; distinct i18n key / surface.
    expect(tip).toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toBe(t('end.mapTip', { name }));
    expect(endMapPlayedTipLine('ridge')).toBe('Map · Ridge');
    expect(endMapPlayedTipLine('ridge')).toMatch(/^Map \u00b7 /);
    expect(t('pause.map', { name })).toBe(t('end.mapTip', { name }));

    expect(tip).not.toBe(pauseBestMapTipLine('ridge'));
    expect(pauseBestMapTipLine('ridge')).toBe('Best map · Ridge');
    expect(pauseBestMapTipLine('ridge')).toMatch(/^Best map \u00b7 /);
    expect(tip).not.toBe(endMapSizeTipLine('ridge'));
    expect(endMapSizeTipLine('ridge')).toBe(
      t('end.mapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(endMapSizeTipLine('ridge')).toBe('Map · 2400×1600');
    expect(endMapSizeTipLine('ridge')).toMatch(/^Map \u00b7 /);
    expect(endMapSizeTipLine('ridge')).toMatch(/×/);
    expect(tip).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Last map · Gap');
    expect(lobbyLastMapTipLine()).toMatch(/^Last map \u00b7 /);
    expect(tip).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(pauseSelectedSectorTipLine('NW')).toBe('Focus · NW');
    expect(pauseSelectedSectorTipLine('NW')).toMatch(/^Focus \u00b7 /);
    expect(tip).not.toBe(pauseSpeciesMottoTipLine('nobles'));
    expect(pauseSpeciesMottoTipLine('nobles')).toMatch(/ \u00b7 /);

    expect(tip).not.toMatch(/^Best map \u00b7 /);
    expect(tip).not.toMatch(/^Last map \u00b7 /);
    expect(tip).not.toMatch(/^Focus \u00b7 /);
    expect(tip).not.toMatch(/×/);
  });

  it('localizes Map middot for pt-BR and es; stays distinct from Best map / Map size / Last map / Focus / motto', () => {
    rememberMatchPrefs('brutes', 'easy', 'gap', 60_000, true);

    setLocale('pt-BR');
    const namePt = mapCopy('ridge').label;
    const pt = pauseMapTipLine('ridge');
    expect(pt).toBe(t('pause.map', { name: namePt }));
    expect(pt).toBe('Mapa · Cume');
    expect(pt).toMatch(/^Mapa \u00b7 /);
    expect(pt).toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toBe(t('end.mapTip', { name: namePt }));
    expect(pt).not.toBe(pauseBestMapTipLine('ridge'));
    expect(pauseBestMapTipLine('ridge')).toBe('Melhor mapa · Cume');
    expect(pauseBestMapTipLine('ridge')).toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toBe(endMapSizeTipLine('ridge'));
    expect(endMapSizeTipLine('ridge')).toBe('Mapa · 2400×1600');
    expect(endMapSizeTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Vão');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(pauseSelectedSectorTipLine('NW')).toBe('Foco · NW');
    expect(pauseSelectedSectorTipLine('NW')).toMatch(/^Foco \u00b7 /);
    expect(pt).not.toBe(pauseSpeciesMottoTipLine('nobles'));
    expect(pt).not.toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toMatch(/^Foco \u00b7 /);
    expect(pt).not.toMatch(/×/);

    setLocale('es');
    const nameEs = mapCopy('ridge').label;
    const es = pauseMapTipLine('ridge');
    expect(es).toBe(t('pause.map', { name: nameEs }));
    expect(es).toBe('Mapa · Cresta');
    expect(es).toMatch(/^Mapa \u00b7 /);
    expect(es).toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toBe(t('end.mapTip', { name: nameEs }));
    expect(es).not.toBe(pauseBestMapTipLine('ridge'));
    expect(pauseBestMapTipLine('ridge')).toBe('Mejor mapa · Cresta');
    expect(pauseBestMapTipLine('ridge')).toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toBe(endMapSizeTipLine('ridge'));
    expect(endMapSizeTipLine('ridge')).toBe('Mapa · 2400×1600');
    expect(endMapSizeTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Brecha');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(pauseSelectedSectorTipLine('NW')).toBe('Foco · NW');
    expect(pauseSelectedSectorTipLine('NW')).toMatch(/^Foco \u00b7 /);
    expect(es).not.toBe(pauseSpeciesMottoTipLine('nobles'));
    expect(es).not.toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toMatch(/^Foco \u00b7 /);
    expect(es).not.toMatch(/×/);
    setLocale('en-GB');
  });
});
