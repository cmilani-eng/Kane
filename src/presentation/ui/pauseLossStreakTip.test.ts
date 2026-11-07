import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
import { pauseLossStreakTipLine } from './pauseLossStreakTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';

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

describe('pauseLossStreakTipLine', () => {
  it('is null when streak is not positive', () => {
    expect(pauseLossStreakTipLine(0)).toBeNull();
    expect(pauseLossStreakTipLine(-1)).toBeNull();
  });

  it('labels Loss streak · n, distinct from lobby loss / pause win streak', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, false);
    expect(pauseLossStreakTipLine(1)).toBe(t('pause.lossStreakTip', { n: 1 }));
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, false);
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).toBe('Loss streak · 2');
    expect(pauseLossStreakTipLine(2)).toMatch(/^Loss streak \u00b7 /);
    // Same en copy as lobby tip; distinct i18n key / surface.
    expect(pauseLossStreakTipLine(2)).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Streak \u00b7 /);
  });

  it('localizes Loss streak middot for pt-BR and es', () => {
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, false);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    setLocale('pt-BR');
    expect(pauseLossStreakTipLine(2)).toBe('Sequência de derrotas · 2');
    expect(pauseLossStreakTipLine(2)).toBe(
      t('pause.lossStreakTip', { n: 2 }),
    );
    expect(pauseLossStreakTipLine(2)).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(pauseLossStreakTipLine(2)).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    setLocale('es');
    expect(pauseLossStreakTipLine(2)).toBe('Racha de derrotas · 2');
    expect(pauseLossStreakTipLine(2)).toBe(
      t('pause.lossStreakTip', { n: 2 }),
    );
    expect(pauseLossStreakTipLine(2)).toMatch(/^Racha de derrotas \u00b7 /);
    expect(pauseLossStreakTipLine(2)).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    setLocale('en-GB');
  });
});
