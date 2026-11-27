import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endLossesTipLine } from './endLossesTip';
import { endLossStreakTipLine } from './endLossStreakTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
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
  setLocale('en-GB');
});

describe('endLossStreakTipLine', () => {
  it('is null before any finished loss', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endLossStreakTipLine()).toBeNull();
  });

  it('labels Loss streak · n with middot, distinct from Streak · / Best streak · / Losses ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, false);
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toBe('Loss streak · 2');
    expect(endLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endLossStreakTipLine()).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    // Distinct from peer career tips (Streak · / Best streak · / Losses ·).
    expect(endWinStreakTipLine()).toBeNull();
    expect(endLossStreakTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe('Best streak · 2');
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    expect(endLossStreakTipLine()).not.toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 2 }));
    expect(endLossesTipLine()).toBe('Losses · 2');
    expect(endLossesTipLine()).toMatch(/^Losses \u00b7 /);
    expect(endLossStreakTipLine()).not.toMatch(/^Streak \u00b7 /);
    expect(endLossStreakTipLine()).not.toMatch(/^Best streak \u00b7 /);
    expect(endLossStreakTipLine()).not.toMatch(/^Losses \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 50_000, true);
    expect(endLossStreakTipLine()).toBeNull();
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 1 }));
    expect(endWinStreakTipLine()).toBe('Streak · 1');
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
  });

  it('localizes Loss streak middot for pt-BR and es; stays distinct from Streak / Best streak / Losses', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, false);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    const pt = endLossStreakTipLine();
    expect(pt).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(pt).toBe('Sequência de derrotas · 2');
    expect(pt).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(pt).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(pt).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBeNull();
    expect(pt).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 2 }));
    expect(endLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(pt).not.toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toMatch(/^Derrotas \u00b7 /);

    setLocale('es');
    const es = endLossStreakTipLine();
    expect(es).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(es).toBe('Racha de derrotas · 2');
    expect(es).toMatch(/^Racha de derrotas \u00b7 /);
    expect(es).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(es).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBeNull();
    expect(es).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 2 }));
    expect(endLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(es).not.toMatch(/^Racha \u00b7 /);
    expect(es).not.toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toMatch(/^Derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
