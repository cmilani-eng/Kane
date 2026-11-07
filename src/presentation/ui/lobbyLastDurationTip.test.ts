import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyMatchLengthTipLine } from './lobbyPanel';

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

describe('lobbyLastDurationTipLine', () => {
  it('returns null when prefs have no last duration', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLastDurationTipLine()).toBeNull();
  });

  it('labels Last · mm:ss from match prefs, distinct from avg length tip', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 125_000);
    const clock = formatMatchClock(125_000);
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Last ·/);
    expect(lobbyLastDurationTipLine()).toContain(clock);
    expect(lobbyLastDurationTipLine()).not.toBe(lobbyMatchLengthTipLine());
  });

  it('keeps last duration when prefs are remembered without a new clock', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge', 90_000);
    rememberMatchPrefs('nobles', 'easy', 'gap');
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(90_000) }),
    );
  });
});
