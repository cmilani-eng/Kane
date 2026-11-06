import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { mapCopy, setLocale, t } from '../../i18n';
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

describe('lobbyLastMapTipLine', () => {
  it('labels the remembered map from match prefs', () => {
    rememberMatchPrefs('weirdos', 'normal', 'crossing');
    const name = mapCopy('crossing').label;
    expect(lobbyLastMapTipLine()).toBe(t('lobby.lastMapTip', { name }));
    expect(lobbyLastMapTipLine()).toContain(name);
    expect(lobbyLastMapTipLine()).toMatch(/^Last map/);
  });
});
