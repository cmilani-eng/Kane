import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
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

  it('labels Loss streak · n after losses, distinct from lobby/pause loss and end win streak', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, false);
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, false);
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toBe('Loss streak · 2');
    expect(endLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endLossStreakTipLine()).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBeNull();
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, true);
    expect(endLossStreakTipLine()).toBeNull();
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 1 }));
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(endWinStreakTipLine()).not.toBe(endLossStreakTipLine());
  });

  it('localizes Loss streak middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, false);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    setLocale('pt-BR');
    expect(endLossStreakTipLine()).toBe('Sequência de derrotas · 2');
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(endLossStreakTipLine()).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).not.toBe(endWinStreakTipLine());
    setLocale('es');
    expect(endLossStreakTipLine()).toBe('Racha de derrotas · 2');
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    expect(endLossStreakTipLine()).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(endLossStreakTipLine()).not.toBe(endWinStreakTipLine());
    setLocale('en-GB');
  });
});
