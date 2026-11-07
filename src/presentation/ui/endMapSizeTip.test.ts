import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endMapSizeTipLine } from './endMapSizeTip';
import { lobbyLastMapSizeTipLine } from './lobbyLastMapSizeTip';

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
  it('labels Map · w×h from MAP catalog, distinct from Map · name / lobby key', () => {
    rememberMatchPrefs('brutes', 'hard', 'ridge');
    expect(endMapSizeTipLine('ridge')).toBe(
      t('end.mapSizeTip', { w: MAP.width, h: MAP.height }),
    );
    expect(endMapSizeTipLine('ridge')).toMatch(/^Map ·/);
    expect(endMapSizeTipLine('ridge')).toContain(`${MAP.width}×${MAP.height}`);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(endMapSizeTipLine('ridge')).toBe(lobbyLastMapSizeTipLine());
    expect(endMapSizeTipLine('ridge')).not.toBe(endMapPlayedTipLine('ridge'));
  });
});
