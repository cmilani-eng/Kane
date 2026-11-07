import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { endBestMapTipLine } from './endBestMapTip';
import { endDifficultyPlayedTipLine } from './endDifficultyPlayedTip';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endMapSizeTipLine } from './endMapSizeTip';
import { formatMatchClock } from './matchClock';
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

describe('endMapPlayedTipLine', () => {
  it('labels Map · name with middot, distinct from Map · size / Best map · / Last map · / pause Map · / meta / Difficulty ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    const name = mapCopy('ridge').label;
    const tip = endMapPlayedTipLine('ridge');
    expect(tip).toBe(t('end.mapTip', { name }));
    expect(tip).toBe('Map · Ridge');
    expect(tip).toMatch(/^Map \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(name);

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(tip).toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toBe(t('pause.map', { name }));
    expect(pauseMapTipLine('ridge')).toBe('Map · Ridge');
    expect(pauseMapTipLine('ridge')).toMatch(/^Map \u00b7 /);
    expect(t('end.mapTip', { name })).toBe(t('pause.map', { name }));

    // Distinct from same-prefix Map · w×h size tip.
    expect(tip).not.toBe(endMapSizeTipLine('ridge'));
    expect(endMapSizeTipLine('ridge')).toBe(
      t('end.mapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(endMapSizeTipLine('ridge')).toBe('Map · 2400×1600');
    expect(endMapSizeTipLine('ridge')).toMatch(/^Map \u00b7 /);
    expect(endMapSizeTipLine('ridge')).toMatch(/×/);

    // Distinct from Best map · / Last map · career peers.
    expect(tip).not.toBe(endBestMapTipLine());
    expect(endBestMapTipLine()).toBe(t('end.bestMapTip', { name }));
    expect(endBestMapTipLine()).toBe('Best map · Ridge');
    expect(endBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    expect(tip).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Last map · Ridge');
    expect(lobbyLastMapTipLine()).toMatch(/^Last map \u00b7 /);

    // Distinct from meta map · difficulty · clock and Difficulty · tip.
    const meta = t('end.meta', {
      map: name,
      difficulty: 'Hard',
      clock: formatMatchClock(125_000),
    });
    expect(tip).not.toBe(meta);
    expect(meta).toContain(name);
    expect(meta).toContain('Hard');
    expect(meta).toContain('2:05');
    expect(tip).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label: 'Hard' }),
    );

    expect(tip).not.toMatch(/^Best map \u00b7 /);
    expect(tip).not.toMatch(/^Last map \u00b7 /);
    expect(tip).not.toMatch(/×/);
  });

  it('localizes Map · name middot for pt-BR and es; stays distinct from Map size / Best map / Last map / pause Map / meta / Difficulty', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const namePt = mapCopy('ridge').label;
    const pt = endMapPlayedTipLine('ridge');
    expect(pt).toBe(t('end.mapTip', { name: namePt }));
    expect(pt).toBe('Mapa · Cume');
    expect(pt).toMatch(/^Mapa \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toBe(t('pause.map', { name: namePt }));
    expect(pt).not.toBe(endMapSizeTipLine('ridge'));
    expect(endMapSizeTipLine('ridge')).toBe('Mapa · 2400×1600');
    expect(endMapSizeTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(endBestMapTipLine());
    expect(endBestMapTipLine()).toBe('Melhor mapa · Cume');
    expect(endBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Cume');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toBe(
      t('end.meta', {
        map: namePt,
        difficulty: 'Difícil',
        clock: formatMatchClock(125_000),
      }),
    );
    expect(pt).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(pt).not.toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toMatch(/×/);

    setLocale('es');
    const nameEs = mapCopy('ridge').label;
    const es = endMapPlayedTipLine('ridge');
    expect(es).toBe(t('end.mapTip', { name: nameEs }));
    expect(es).toBe('Mapa · Cresta');
    expect(es).toMatch(/^Mapa \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).toBe(pauseMapTipLine('ridge'));
    expect(pauseMapTipLine('ridge')).toBe(t('pause.map', { name: nameEs }));
    expect(es).not.toBe(endMapSizeTipLine('ridge'));
    expect(endMapSizeTipLine('ridge')).toBe('Mapa · 2400×1600');
    expect(endMapSizeTipLine('ridge')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(endBestMapTipLine());
    expect(endBestMapTipLine()).toBe('Mejor mapa · Cresta');
    expect(endBestMapTipLine()).toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Último mapa · Cresta');
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toBe(
      t('end.meta', {
        map: nameEs,
        difficulty: 'Difícil',
        clock: formatMatchClock(125_000),
      }),
    );
    expect(es).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(es).not.toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toMatch(/×/);
    setLocale('en-GB');
  });
});
