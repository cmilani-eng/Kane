import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
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

describe('lobbyBestWinStreakTipLine', () => {
  it('is null before any finished win', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyBestWinStreakTipLine()).toBeNull();
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(lobbyBestWinStreakTipLine()).toBeNull();
  });

  it('labels Best streak · n with middot, distinct from Streak · / Loss streak · / Record · / pause Best streak ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toBe('Best streak · 2');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(lobbyBestWinStreakTipLine()).toBe(endBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    expect(endBestWinStreakTipLine()).toBe(t('end.bestWinStreakTip', { n: 2 }));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    // Distinct from peer career tips.
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(lobbyLossStreakTipLine()).toBeNull();
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);

    // Peak survives a loss that clears current Streak ·.
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toBe('Loss streak · 1');
    expect(lobbyLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyLossStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    expect(lobbyBestWinStreakTipLine()).toBe(endBestWinStreakTipLine());

    rememberMatchPrefs('nobles', 'normal', 'crossing', 50_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyWinStreakTipLine());
  });

  it('raises the peak when a longer streak lands', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 70_000, false);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 60_000, true);
    rememberMatchPrefs('brutes', 'normal', 'crossing', 55_000, true);
    rememberMatchPrefs('nobles', 'hard', 'ridge', 50_000, true);
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 3 }),
    );
    expect(lobbyBestWinStreakTipLine()).toBe('Best streak · 3');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
  });

  it('localizes Best streak middot for pt-BR and es; stays distinct from Streak / Loss streak / Record / pause Best streak', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);

    setLocale('pt-BR');
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toBe('Melhor sequência · 2');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).toBe(endBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    expect(endBestWinStreakTipLine()).toBe(t('end.bestWinStreakTip', { n: 2 }));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyLossStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));

    // Fresh win streak for es.
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    setLocale('es');
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toBe('Mejor racha · 2');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).toBe(endBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    expect(endBestWinStreakTipLine()).toBe(t('end.bestWinStreakTip', { n: 2 }));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 4, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    expect(lobbyBestWinStreakTipLine()).not.toBe(lobbyLossStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(
      t('lobby.bestWinStreakTip', { n: 2 }),
    );
    expect(lobbyBestWinStreakTipLine()).toBe(pauseBestWinStreakTipLine(2));
    setLocale('en-GB');
  });
});
