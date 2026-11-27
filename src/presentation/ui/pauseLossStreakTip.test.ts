import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endLossStreakTipLine } from './endLossStreakTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
import { pauseBestWinStreakTipLine } from './pauseBestWinStreakTip';
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

  it('labels Loss streak · n with middot, distinct from Streak · / Best streak · / Losses ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Best streak \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(pauseLossStreakTipLine(1)).toBe(t('pause.lossStreakTip', { n: 1 }));
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, false);
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).toBe('Loss streak · 2');
    expect(pauseLossStreakTipLine(2)).toMatch(/^Loss streak \u00b7 /);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseLossStreakTipLine(2)).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    // Distinct from peer career tips (Streak · / Best streak · / Losses ·).
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe('Streak · 2');
    expect(pauseWinStreakTipLine(2)).toMatch(/^Streak \u00b7 /);
    expect(pauseLossStreakTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toBe('Best streak · 2');
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Best streak \u00b7 /);
    expect(pauseLossStreakTipLine(2)).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toBe('Losses · 2');
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
    expect(pauseLossStreakTipLine(2)).not.toMatch(/^Streak \u00b7 /);
    expect(pauseLossStreakTipLine(2)).not.toMatch(/^Best streak \u00b7 /);
    expect(pauseLossStreakTipLine(2)).not.toMatch(/^Losses \u00b7 /);
  });

  it('localizes Loss streak middot for pt-BR and es; stays distinct from Streak / Best streak / Losses', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'gap', 75_000, false);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    const pt = pauseLossStreakTipLine(2);
    expect(pt).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(pt).toBe('Sequência de derrotas · 2');
    expect(pt).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(pt).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(pt).toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(pt).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(pt).not.toMatch(/^Sequência \u00b7 /);
    expect(pt).not.toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toMatch(/^Derrotas \u00b7 /);

    setLocale('es');
    const es = pauseLossStreakTipLine(2);
    expect(es).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(es).toBe('Racha de derrotas · 2');
    expect(es).toMatch(/^Racha de derrotas \u00b7 /);
    expect(es).toBe(lobbyLossStreakTipLine());
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 2 }));
    expect(es).toBe(endLossStreakTipLine());
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 2 }));
    expect(es).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Racha \u00b7 /);
    expect(es).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(es).not.toMatch(/^Racha \u00b7 /);
    expect(es).not.toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toMatch(/^Derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
