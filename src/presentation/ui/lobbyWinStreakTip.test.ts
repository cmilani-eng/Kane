import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
import { pauseWinStreakTipLine } from './pauseWinStreakTip';

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

describe('lobbyWinStreakTipLine', () => {
  it('is null before any finished outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyWinStreakTipLine()).toBeNull();
  });

  it('labels Streak · n with middot, distinct from Loss streak · / Record · / Wins · / Best streak ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 2');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak ·/);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(lobbyWinStreakTipLine()).toBe(endWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    // Distinct from peer career tips (Loss streak · / Record · / Wins ·).
    expect(lobbyLossStreakTipLine()).toBeNull();
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toBe('Loss streak · 1');
    expect(lobbyLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
    // Rebuild a win streak of 2 for peer-distinctness checks.
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(lobbyWinStreakTipLine()).toBe('Streak · 2');
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 4, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 4 }));
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
  });

  it('keeps streak when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
  });

  it('localizes Streak middot for pt-BR and es; stays distinct from Loss streak · / Record · / Wins ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    setLocale('pt-BR');
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBe('Sequência · 2');
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(lobbyWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(lobbyWinStreakTipLine()).toBe(endWinStreakTipLine());
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    // Loss streak peer after a loss.
    rememberMatchPrefs('weirdos', 'hard', 'gap', 50_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);

    // Fresh win streak for es.
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    setLocale('es');
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).toBe('Racha · 2');
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(lobbyWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(lobbyWinStreakTipLine()).toBe(endWinStreakTipLine());
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 4, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(lobbyWinStreakTipLine()).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 4 }));
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 50_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
