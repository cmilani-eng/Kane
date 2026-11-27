import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endBestApmTipLine } from './endBestApmTip';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endLossStreakTipLine } from './endLossStreakTip';
import { endWinRateTipLine } from './endWinRateTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
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

describe('endWinStreakTipLine', () => {
  it('is null before any finished win', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endWinStreakTipLine()).toBeNull();
  });

  it('labels Streak · n with middot, distinct from Loss streak · / Win rate · / Best APM · / Record ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 60_000, true, 90);
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 1 }));
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true, 48);
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe('Streak · 2');
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(endWinStreakTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak ·/);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endWinStreakTipLine()).toBe(lobbyWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    // Distinct from peer career tips (Loss streak · / Win rate · / Best APM · / Record ·).
    expect(endLossStreakTipLine()).toBeNull();
    expect(endWinStreakTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    expect(endWinStreakTipLine()).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 90 }));
    expect(endBestApmTipLine()).toMatch(/^Best APM \u00b7 /);
    expect(endWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    // Loss streak peer after a loss.
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, false);
    expect(endWinStreakTipLine()).toBeNull();
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toBe('Loss streak · 1');
    expect(endLossStreakTipLine()).toMatch(/^Loss streak \u00b7 /);
  });

  it('localizes Streak middot for pt-BR and es; stays distinct from Loss streak · / Win rate · / Best APM · / Record ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true, 48);
    setLocale('pt-BR');
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe('Sequência · 2');
    expect(endWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(endWinStreakTipLine()).toBe(lobbyWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinStreakTipLine()).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 90 }));
    expect(endWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 50_000, false);
    expect(endWinStreakTipLine()).toBeNull();
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);

    // Fresh win streak for es.
    rememberMatchPrefs('nobles', 'normal', 'crossing', 60_000, true, 90);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true, 48);
    setLocale('es');
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe('Racha · 2');
    expect(endWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(endWinStreakTipLine()).toBe(lobbyWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(pauseWinStreakTipLine(2));
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 80 }));
    expect(endWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    expect(endWinStreakTipLine()).not.toBe(endBestApmTipLine());
    expect(endBestApmTipLine()).toBe(t('end.bestApmTip', { n: 90 }));
    expect(endWinStreakTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 4, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 50_000, false);
    expect(endWinStreakTipLine()).toBeNull();
    expect(endLossStreakTipLine()).toBe(t('end.lossStreakTip', { n: 1 }));
    expect(endLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
