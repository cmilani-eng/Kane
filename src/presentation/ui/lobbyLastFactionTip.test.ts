import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, setLocale, t } from '../../i18n';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';

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

describe('lobbyLastFactionTipLine', () => {
  it('labels the remembered faction from match prefs', () => {
    rememberMatchPrefs('weirdos', 'normal', 'crossing');
    const name = speciesCopy('weirdos').name;
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name }),
    );
    expect(lobbyLastFactionTipLine()).toContain(name);
    expect(lobbyLastFactionTipLine()).toMatch(/^Last/);
  });
});
