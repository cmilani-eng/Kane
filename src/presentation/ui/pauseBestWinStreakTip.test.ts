import { beforeEach, describe, expect, it } from 'vitest';
import { loadMatchPrefs, rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { pauseBestApmTipLine } from './pauseBestApmTip';
import { pauseBestWinStreakTipLine } from './pauseBestWinStreakTip';
import { pauseLossStreakTipLine } from './pauseLossStreakTip';
import { pauseWinRateTipLine } from './pauseWinRateTip';
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

describe('pauseBestWinStreakTipLine', () => {
  it('is null when peak streak is not positive', () => {
    expect(pauseBestWinStreakTipLine(0)).toBeNull();
    expect(pauseBestWinStreakTipLine(-1)).toBeNull();
  });

  it('labels Best streak · n with middot, distinct from Streak · / Loss streak · / Win rate · / Best APM ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    const n = Math.max(
      loadMatchPrefs().bestWinStreak ?? 0,
      loadMatchPrefs().winStreak ?? 0,
    );
    expect(n).toBe(2);
    expect(pauseBestWinStreakTipLine(n)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(n)).toBe('Best streak · 2');
    expect(pauseBestWinStreakTipLine(n)).toMatch(/^Best streak \u00b7 /);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseBestWinStreakTipLine(n)).toBe(lobbyBestWinStreakTipLine());
    expect(pauseBestWinStreakTipLine(n)).toBe(endBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe(t('end.bestWinStreakTip', { n: 2 }));
    // Distinct from peer career tips.
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Streak \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).toMatch(/^Loss streak \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toMatch(/^Win rate \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseBestApmTipLine(90));
    expect(pauseBestApmTipLine(90)).toBe(t('pause.bestApmTip', { n: 90 }));
    expect(pauseBestApmTipLine(90)).toMatch(/^Best APM \u00b7 /);

    // Peak survives a loss that clears current Streak ·.
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(pauseWinStreakTipLine(0)).toBeNull();
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toBe(lobbyBestWinStreakTipLine());
  });

  it('localizes Best streak middot for pt-BR and es; stays distinct from Streak / Loss streak / Win rate / Best APM', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    const n = 2;

    setLocale('pt-BR');
    expect(pauseBestWinStreakTipLine(n)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(n)).toBe('Melhor sequência · 2');
    expect(pauseBestWinStreakTipLine(n)).toMatch(/^Melhor sequência \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).toBe(lobbyBestWinStreakTipLine());
    expect(pauseBestWinStreakTipLine(n)).toBe(endBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe(t('end.bestWinStreakTip', { n: 2 }));
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Sequência \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseBestApmTipLine(48));
    expect(pauseBestApmTipLine(48)).toBe(t('pause.bestApmTip', { n: 48 }));

    setLocale('es');
    expect(pauseBestWinStreakTipLine(n)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(n)).toBe('Mejor racha · 2');
    expect(pauseBestWinStreakTipLine(n)).toMatch(/^Mejor racha \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).toBe(lobbyBestWinStreakTipLine());
    expect(pauseBestWinStreakTipLine(n)).toBe(endBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe(t('end.bestWinStreakTip', { n: 2 }));
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Racha \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toMatch(/^Racha de derrotas \u00b7 /);
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseBestWinStreakTipLine(n)).not.toBe(pauseBestApmTipLine(48));
    expect(pauseBestApmTipLine(48)).toBe(t('pause.bestApmTip', { n: 48 }));
    setLocale('en-GB');
  });
});
