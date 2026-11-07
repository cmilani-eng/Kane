import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endLossStreakTipLine } from './endLossStreakTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { pauseLossStreakTipLine } from './pauseLossStreakTip';

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

  it('labels Loss streak · n with middot, distinct from Streak · / Best streak · / Losses ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, false);
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(lobbyLossStreakTipLine()).toBe('Loss streak · 2');
    expect(lobbyLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(lobbyLossStreakTipLine()).toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(lobbyLossStreakTipLine()).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    // Distinct from peer career tips (Streak · / Best streak · / Losses ·).
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toBe('Best streak · 2');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    expect(lobbyLossStreakTipLine()).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toBe('Losses · 2');
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
    expect(lobbyLossStreakTipLine()).not.toMatch(/^Streak \u00b7 /);
    expect(lobbyLossStreakTipLine()).not.toMatch(/^Best streak \u00b7 /);
    expect(lobbyLossStreakTipLine()).not.toMatch(/^Losses \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 50_000, true);
    expect(lobbyLossStreakTipLine()).toBeNull();
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 1');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
  });

  it('keeps loss streak when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, false);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, false);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
  });

  it('localizes Loss streak middot for pt-BR and es; stays distinct from Streak / Best streak / Losses', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, false);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    const pt = lobbyLossStreakTipLine();
    expect(pt).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(pt).toBe('Sequência de derrotas · 2');
    expect(pt).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(pt).toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(pt).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(pt).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(pt).not.toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toMatch(/^Derrotas \u00b7 /);

    setLocale('es');
    const es = lobbyLossStreakTipLine();
    expect(es).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(es).toBe('Racha de derrotas · 2');
    expect(es).toMatch(/^Racha de derrotas \u00b7 /);
    expect(es).toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(es).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(es).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(es).not.toMatch(/^Racha \u00b7 /);
    expect(es).not.toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toMatch(/^Derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
