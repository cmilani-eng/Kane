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

  it('labels Streak · n with middot, distinct from Best streak · / Loss streak · / Record · / Wins ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    rememberMatchPrefs('brutes', 'easy', 'ridge', 80_000, true);
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    const streak = lobbyWinStreakTipLine();
    expect(streak).toBe('Streak · 2');
    expect(streak).toMatch(/^Streak \u00b7 /);
    expect(streak).toContain(' \u00b7 ');
    expect(streak).not.toMatch(/ {2}/);
    expect(streak).not.toMatch(/^Best streak \u00b7 /);
    expect(streak).not.toMatch(/^Loss streak \u00b7 /);
    expect(streak).not.toMatch(/^Record \u00b7 /);
    expect(streak).not.toMatch(/^Wins \u00b7 /);
    expect(streak).not.toBe(lobbyLastOutcomeTipLine());
    expect(streak).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe('Best streak · 2');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    // Same en copy as end/pause tips; distinct i18n key / surface.
    expect(streak).toBe(endWinStreakTipLine());
    expect(streak).toBe(pauseWinStreakTipLine(2));
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
    const rebuilt = lobbyWinStreakTipLine();
    expect(rebuilt).toBe('Streak · 2');
    expect(rebuilt).toContain(' \u00b7 ');
    expect(rebuilt).not.toMatch(/ {2}/);
    expect(rebuilt).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 4, l: 1 }));
    expect(lobbyRecordTipLine()).toBe('Record · 4–1');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(rebuilt).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 4 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 4');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);
    expect(rebuilt).not.toMatch(/^Best streak \u00b7 /);
    expect(rebuilt).not.toMatch(/^Loss streak \u00b7 /);
    expect(rebuilt).not.toMatch(/^Record \u00b7 /);
    expect(rebuilt).not.toMatch(/^Wins \u00b7 /);
  });

  it('keeps streak when later remember omits outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
  });

  it('localizes Streak middot for pt-BR and es; stays distinct from Best streak / Loss streak / Record / Wins', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    const pt = lobbyWinStreakTipLine();
    expect(pt).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(pt).toBe('Sequência · 2');
    expect(pt).toMatch(/^Sequência \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toMatch(/ {2}/);
    expect(pt).toBe(pauseWinStreakTipLine(2));
    expect(pt).toBe(endWinStreakTipLine());
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(pt).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(t('lobby.bestWinStreakTip', { n: 2 }));
    expect(lobbyBestWinStreakTipLine()).toBe('Melhor sequência · 2');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toBe('Vitórias · 2');
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);
    expect(pt).not.toMatch(/^Melhor sequência \u00b7 /);
    expect(pt).not.toMatch(/^Sequência de derrotas \u00b7 /);
    expect(pt).not.toMatch(/^Recorde \u00b7 /);
    expect(pt).not.toMatch(/^Vitórias \u00b7 /);
    // Loss streak peer after a loss.
    rememberMatchPrefs('weirdos', 'hard', 'gap', 50_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toMatch(/^Sequência de derrotas \u00b7 /);

    // Fresh win streak for es.
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    setLocale('es');
    const es = lobbyWinStreakTipLine();
    expect(es).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(es).toBe('Racha · 2');
    expect(es).toMatch(/^Racha \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toMatch(/ {2}/);
    expect(es).toBe(pauseWinStreakTipLine(2));
    expect(es).toBe(endWinStreakTipLine());
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(es).not.toBe(lobbyBestWinStreakTipLine());
    expect(lobbyBestWinStreakTipLine()).toBe(t('lobby.bestWinStreakTip', { n: 2 }));
    expect(lobbyBestWinStreakTipLine()).toBe('Mejor racha · 2');
    expect(lobbyBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 4, l: 1 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(es).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 4 }));
    expect(lobbyWinsTipLine()).toBe('Victorias · 4');
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);
    expect(es).not.toMatch(/^Mejor racha \u00b7 /);
    expect(es).not.toMatch(/^Racha de derrotas \u00b7 /);
    expect(es).not.toMatch(/^Récord \u00b7 /);
    expect(es).not.toMatch(/^Victorias \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap', 50_000, false);
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(lobbyLossStreakTipLine()).toBe(t('lobby.lossStreakTip', { n: 1 }));
    expect(lobbyLossStreakTipLine()).toMatch(/^Racha de derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
