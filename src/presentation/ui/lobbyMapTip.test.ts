import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, mapCopy, setLocale, speciesName, t } from '../../i18n';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyDifficultyTipLine, lobbyFactionTipLine, lobbyMapTipLine, lobbySetupLine } from './lobbyPanel';
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

describe('lobbyMapTipLine', () => {
  it('labels {label} · {blurb} with middot, distinct from Last map · / Best map · / Map · w×h / Map · name / difficulty / motto / setup', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 200_000, false);

    const map = mapCopy('gap');
    const tip = lobbyMapTipLine();
    expect(tip).toBe(t('lobby.mapTip', { label: map.label, blurb: map.blurb }));
    expect(tip).toBe('Gap · West vs east · vertical CORE');
    expect(tip).toMatch(/^Gap \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(map.label);
    expect(tip).toContain(map.blurb);
    // Blurb itself may contain middots; separator stays single-spaced U+00B7.
    expect(tip).not.toContain('  ·  ');
    // Same shape as menu map tip; distinct i18n key / surface.
    expect(tip).toBe(t('menu.mapTip', { label: map.label, blurb: map.blurb }));
    expect(t('lobby.mapTip', { label: map.label, blurb: map.blurb })).toBe(
      t('menu.mapTip', { label: map.label, blurb: map.blurb }),
    );

    // Distinct from Last map · / Best map · / Map · w×h peers.
    expect(tip).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toBe('Last map · Gap');
    expect(lobbyLastMapTipLine()).toMatch(/^Last map \u00b7 /);
    expect(tip).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe('Best map · Ridge');
    expect(lobbyBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    expect(tip).not.toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(lobbyLastMapSizeTipLine()).toBe('Map · 2400×1600');
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Map \u00b7 /);

    // Distinct from same-prefix Map · name peers (pause / end).
    expect(tip).not.toBe(pauseMapTipLine('gap'));
    expect(pauseMapTipLine('gap')).toBe('Map · Gap');
    expect(pauseMapTipLine('gap')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toBe(endMapPlayedTipLine('gap'));
    expect(endMapPlayedTipLine('gap')).toBe('Map · Gap');
    expect(endMapPlayedTipLine('gap')).toMatch(/^Map \u00b7 /);

    // Distinct from sibling chrome tips (difficulty · blurb / motto / setup).
    const d = difficultyCopy('hard');
    expect(tip).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toBe(
      t('lobby.difficultyTip', { label: d.label, blurb: d.blurb }),
    );
    expect(lobbyDifficultyTipLine()).toMatch(/^Hard \u00b7 /);
    expect(tip).not.toBe(lobbyFactionTipLine());
    expect(lobbyFactionTipLine()).toMatch(/ \u00b7 /);
    const setup = lobbySetupLine();
    expect(tip).not.toBe(setup);
    expect(setup).toBe(
      t('pause.setup', {
        species: speciesName('weirdos'),
        map: map.label,
        difficulty: d.label,
      }),
    );
    expect(setup).toContain('  ·  ');

    expect(tip).not.toMatch(/^Last map \u00b7 /);
    expect(tip).not.toMatch(/^Best map \u00b7 /);
    expect(tip).not.toMatch(/^Map \u00b7 /);
  });

  it('localizes label · blurb middot for pt-BR and es; stays distinct from Last map / Best map / Map size / Map name', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 200_000, false);

    setLocale('pt-BR');
    const ptMap = mapCopy('gap');
    const pt = lobbyMapTipLine();
    expect(pt).toBe(
      t('lobby.mapTip', { label: ptMap.label, blurb: ptMap.blurb }),
    );
    expect(pt).toBe('Vão · Oeste contra leste · CORE vertical');
    expect(pt).toMatch(/^Vão \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toContain('  ·  ');
    expect(pt).toBe(t('menu.mapTip', { label: ptMap.label, blurb: ptMap.blurb }));
    expect(pt).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(pauseMapTipLine('gap'));
    expect(pauseMapTipLine('gap')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(endMapPlayedTipLine('gap'));
    expect(endMapPlayedTipLine('gap')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toMatch(/^Difícil \u00b7 /);
    expect(pt).not.toMatch(/^Último mapa \u00b7 /);
    expect(pt).not.toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toMatch(/^Mapa \u00b7 /);

    setLocale('es');
    const esMap = mapCopy('gap');
    const es = lobbyMapTipLine();
    expect(es).toBe(
      t('lobby.mapTip', { label: esMap.label, blurb: esMap.blurb }),
    );
    expect(es).toBe('Brecha · Oeste contra este · CORE vertical');
    expect(es).toMatch(/^Brecha \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toContain('  ·  ');
    expect(es).toBe(t('menu.mapTip', { label: esMap.label, blurb: esMap.blurb }));
    expect(es).not.toBe(lobbyLastMapTipLine());
    expect(lobbyLastMapTipLine()).toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toBe(lobbyBestMapTipLine());
    expect(es).not.toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(pauseMapTipLine('gap'));
    expect(pauseMapTipLine('gap')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(endMapPlayedTipLine('gap'));
    expect(es).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toMatch(/^Difícil \u00b7 /);
    expect(es).not.toMatch(/^Último mapa \u00b7 /);
    expect(es).not.toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toMatch(/^Mapa \u00b7 /);
    setLocale('en-GB');
  });
});
