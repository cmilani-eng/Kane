import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyLastMapSizeTipLine } from './lobbyLastMapSizeTip';
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

describe('lobbyLastMapSizeTipLine', () => {
  it('labels Map · w×h from remembered prefs + MAP catalog', () => {
    rememberMatchPrefs('brutes', 'hard', 'ridge');
    expect(lobbyLastMapSizeTipLine()).toBe(
      t('lobby.lastMapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(lobbyLastMapSizeTipLine()).toMatch(/^Map ·/);
    expect(lobbyLastMapSizeTipLine()).toContain(`${MAP.width}×${MAP.height}`);
    expect(lobbyLastMapSizeTipLine()).not.toBe(lobbyLastMapTipLine());
  });
});
