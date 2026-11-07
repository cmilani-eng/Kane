import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';

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

describe('lobbyBestDurationTipLine', () => {
  it('returns null before any winning duration', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, false);
    expect(lobbyBestDurationTipLine()).toBeNull();
  });

  it('tracks shortest win and ignores losses / slower wins', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 125_000, true);
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(125_000) }),
    );
    rememberMatchPrefs('brutes', 'easy', 'ridge', 90_000, true);
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    rememberMatchPrefs('nobles', 'normal', 'gap', 200_000, true);
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, false);
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyBestDurationTipLine()).toMatch(/^Best ·/);
    expect(lobbyBestDurationTipLine()).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyBestDurationTipLine()).not.toBe(lobbyAvgDurationTipLine());
  });

  it('keeps best when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(80_000) }),
    );
  });
});
