import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
  setLocale('en-GB');
});

afterEach(() => {
  store.clear();
});

describe('lobbyLossStreakTipLine', () => {
  it('is null before any finished outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLossStreakTipLine()).toBeNull();
  });

  it('labels Loss streak · n, distinct from Streak / Best streak / Losses', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, false);
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, false);
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(lobbyLossStreakTipLine()).toBe('Loss streak · 2');
    expect(lobbyLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyBestWinStreakTipLine()).toBeNull();
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossStreakTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toMatch(/^Losses ·/);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, true);
    expect(lobbyLossStreakTipLine()).toBeNull();
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak ·/);
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 1 }),
    );
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak ·/);
  });

  it('keeps loss streak when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, false);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, false);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
  });

  it('localizes Loss streak middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, false);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    setLocale('pt-BR');
    expect(lobbyLossStreakTipLine()).toBe('Sequência de derrotas · 2');
    expect(lobbyLossStreakTipLine()).toBe(
      t('lobby.lossStreakTip', { n: 2 }),
    );
    expect(lobbyLossStreakTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyLossStreakTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    setLocale('es');
    expect(lobbyLossStreakTipLine()).toBe('Racha de derrotas · 2');
    expect(lobbyLossStreakTipLine()).toBe(
      t('lobby.lossStreakTip', { n: 2 }),
    );
    expect(lobbyLossStreakTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyLossStreakTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
  });
});
