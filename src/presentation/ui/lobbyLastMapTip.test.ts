import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyLastMapSizeTipLine } from './lobbyLastMapSizeTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';
import { lobbyMapTipLine } from './lobbyPanel';

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

describe('lobbyLastMapTipLine', () => {
  it('labels Last map · name with middot, distinct from Best map · / Map · size / blurb', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    rememberMatchPrefs('brutes', 'hard', 'gap', 200_000, false);
    const name = mapCopy('gap').label;
    const line = lobbyLastMapTipLine();
    expect(line).toBe(t('lobby.lastMapTip', { name }));
    expect(line).toBe('Last map · Gap');
    expect(line).toMatch(/^Last map \u00b7 /);
    expect(line).toContain(' \u00b7 ');

    // Distinct from Best map · (shortest win is ridge) / Map · size / selected blurb.
    expect(line).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toBe('Best map · Ridge');
    expect(lobbyBestMapTipLine()).toMatch(/^Best map \u00b7 /);
    expect(line).not.toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Map \u00b7 /);
    expect(line).not.toBe(lobbyMapTipLine());
    expect(lobbyMapTipLine()).toMatch(/ · /);
    expect(lobbyMapTipLine()).toContain(name);
  });

  it('tracks the latest remembered map, distinct from Best map ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    // Last remembered map is ridge; best map is also ridge (shortest win).
    expect(lobbyLastMapTipLine()).toBe('Last map · Ridge');
    expect(lobbyBestMapTipLine()).toBe('Best map · Ridge');
    expect(lobbyLastMapTipLine()).not.toBe(lobbyBestMapTipLine());

    // Rematch prefs without outcome still update last map.
    rememberMatchPrefs('weirdos', 'normal', 'gap');
    expect(lobbyLastMapTipLine()).toBe(
      t('lobby.lastMapTip', { name: mapCopy('gap').label }),
    );
    expect(lobbyLastMapTipLine()).toBe('Last map · Gap');
    expect(lobbyLastMapTipLine()).toMatch(/^Last map \u00b7 /);
    // Best map stays on shortest win (ridge).
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toBe('Best map · Ridge');
  });

  it('localizes Last map · name middot for pt-BR and es; stays distinct from Best map / Map size / blurb', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    rememberMatchPrefs('brutes', 'hard', 'gap', 200_000, false);

    setLocale('pt-BR');
    const ptName = mapCopy('gap').label;
    const pt = lobbyLastMapTipLine();
    expect(pt).toBe(t('lobby.lastMapTip', { name: ptName }));
    expect(pt).toBe('Último mapa · Vão');
    expect(pt).toMatch(/^Último mapa \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toBe('Melhor mapa · Cume');
    expect(lobbyBestMapTipLine()).toMatch(/^Melhor mapa \u00b7 /);
    expect(pt).not.toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(lobbyMapTipLine());
    expect(lobbyMapTipLine()).toContain(ptName);

    setLocale('es');
    const esName = mapCopy('gap').label;
    const es = lobbyLastMapTipLine();
    expect(es).toBe(t('lobby.lastMapTip', { name: esName }));
    expect(es).toBe('Último mapa · Brecha');
    expect(es).toMatch(/^Último mapa \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(lobbyBestMapTipLine());
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toBe('Mejor mapa · Cresta');
    expect(lobbyBestMapTipLine()).toMatch(/^Mejor mapa \u00b7 /);
    expect(es).not.toBe(lobbyLastMapSizeTipLine());
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(lobbyMapTipLine());
    expect(lobbyMapTipLine()).toContain(esName);
    setLocale('en-GB');
  });
});
