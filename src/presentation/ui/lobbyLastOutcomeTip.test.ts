import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';

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

describe('lobbyLastOutcomeTipLine', () => {
  it('returns null when prefs have no last outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLastOutcomeTipLine()).toBeNull();
  });

  it('labels Last · Won / Lost from match prefs, distinct from duration / faction / streak', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toBe('Last · Won');
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Last ·/);
    expect(lobbyLastOutcomeTipLine()).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastOutcomeTipLine()).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastOutcomeTipLine()).not.toBe(lobbyWinStreakTipLine());

    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeLoss'));
    expect(lobbyLastOutcomeTipLine()).toBe('Last · Lost');
    expect(lobbyLastOutcomeTipLine()).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastOutcomeTipLine()).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastOutcomeTipLine()).not.toBe(lobbyWinStreakTipLine());
  });

  it('keeps last outcome when prefs are remembered without a new result', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
  });
});
