import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endBestApmTipLine } from './endBestApmTip';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endLossStreakTipLine } from './endLossStreakTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { pauseBestWinStreakTipLine } from './pauseBestWinStreakTip';

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

describe('endBestWinStreakTipLine', () => {
  it('is null before any finished win', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endBestWinStreakTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(endBestWinStreakTipLine()).toBeNull();
  });

  it('labels Best streak · n with middot, distinct from Streak · / Loss streak · / Best APM · / lobby-pause Best streak ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true, 48);
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe('Best streak · 2');
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endBestWinStreakTipLine()).toBe(lobbyBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    // Distinct from peer career tips.
    expect(endBestWinStreakTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(endLossStreakTipLine()).toBeNull();
    expect(endBestWinStreakTipLine()).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 90 }));
    expect(endBestApmTipLine()).toMatch(/^Best APM \u00b7 /);

    // Peak survives a loss that clears current Streak ·.
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(endWinStreakTipLine()).toBeNull();
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toBe('Loss streak · 1');
    expect(endLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).not.toBe(endLossStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(lobbyBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
  });

  it('raises the peak when a longer streak lands', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 70_000, false);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 60_000, true);
    rememberMatchPrefs('brutes', 'normal', 'crossing', 55_000, true);
    rememberMatchPrefs('nobles', 'hard', 'ridge', 50_000, true);
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 3 }),
    );
    expect(endBestWinStreakTipLine()).toBe('Best streak · 3');
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
  });

  it('localizes Best streak middot for pt-BR and es; stays distinct from Streak / Loss streak / Best APM / lobby-pause Best streak', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true, 48);

    setLocale('pt-BR');
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe('Melhor sequência · 2');
    expect(endBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);
    expect(endBestWinStreakTipLine()).toBe(lobbyBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(endBestWinStreakTipLine()).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 90 }));
    expect(endBestApmTipLine()).toMatch(/^Melhor APM \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(endWinStreakTipLine()).toBeNull();
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(endBestWinStreakTipLine()).not.toBe(endLossStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe(lobbyBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));

    // Fresh win streak for es.
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true, 48);
    setLocale('es');
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe('Mejor racha · 2');
    expect(endBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    expect(endBestWinStreakTipLine()).toBe(lobbyBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(endBestWinStreakTipLine()).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 90 }));
    expect(endBestApmTipLine()).toMatch(/^Mejor APM \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(endWinStreakTipLine()).toBeNull();
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    expect(endBestWinStreakTipLine()).not.toBe(endLossStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(
      t('end.bestWinStreakTip', { n: 2 }),
    );
    expect(endBestWinStreakTipLine()).toBe(lobbyBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    setLocale('en-GB');
  });
});
