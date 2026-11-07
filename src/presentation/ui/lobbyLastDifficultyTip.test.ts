import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, setLocale, t } from '../../i18n';
import { lobbyLastDifficultyTipLine } from './lobbyLastDifficultyTip';

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

describe('lobbyLastDifficultyTipLine', () => {
  it('labels the remembered difficulty from match prefs', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing');
    const label = difficultyCopy('hard').label;
    expect(lobbyLastDifficultyTipLine()).toBe(
      t('lobby.lastDifficultyTip', { label }),
    );
    expect(lobbyLastDifficultyTipLine()).toContain(label);
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Last difficulty/);
  });
});
