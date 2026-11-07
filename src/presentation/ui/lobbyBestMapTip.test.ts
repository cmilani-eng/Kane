import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';

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
  });

  it('tracks map of shortest win and ignores losses / slower wins', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 125_000, true);
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('crossing').label }),
    );
    rememberMatchPrefs('brutes', 'easy', 'ridge', 90_000, true);
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    rememberMatchPrefs('nobles', 'normal', 'gap', 200_000, true);
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, false);
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('ridge').label }),
    );
    expect(lobbyBestMapTipLine()).toMatch(/^Best map ·/);
    expect(lobbyBestMapTipLine()).not.toBe(lobbyLastMapTipLine());
    expect(lobbyBestMapTipLine()).not.toBe(lobbyBestDurationTipLine());
  });

  it('localizes Best map middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, true);
    setLocale('pt-BR');
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(lobbyBestMapTipLine()).toMatch(/^Melhor mapa ·/);
    setLocale('es');
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('gap').label }),
    );
    expect(lobbyBestMapTipLine()).toMatch(/^Mejor mapa ·/);
  });

  it('keeps best map when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyBestMapTipLine()).toBe(
      t('lobby.bestMapTip', { name: mapCopy('crossing').label }),
    );
  });
});
