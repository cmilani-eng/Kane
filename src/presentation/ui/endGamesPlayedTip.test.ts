import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endBestWinStreakTipLine } from './endBestWinStreakTip';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { endSpeciesPlayedTipLine } from './endSpeciesPlayedTip';
import { endWinRateTipLine } from './endWinRateTip';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';

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

describe('endGamesPlayedTipLine', () => {
  it('is null before any finished match outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(endGamesPlayedTipLine()).toBeNull();
  });

  it('labels Played · n with middot, distinct from Record · / Streak · / Win rate · / Best streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe('Played · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    // Same en copy as lobby/pause tips; distinct i18n key / surface.
    expect(endGamesPlayedTipLine()).toBe(lobbyGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(pauseGamesPlayedTipLine(2));
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    // Distinct from end species Played · faction tip (double-spaced middot).
    expect(endGamesPlayedTipLine()).not.toBe(
      endSpeciesPlayedTipLine('nobles'),
    );
    // Distinct from peer career tips (Record · / Streak · / Win rate · / Best streak ·).
    expect(endGamesPlayedTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe('Streak · 2');
    expect(endWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinRateTipLine()).toBe('Win rate · 100%');
    expect(endWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toBe(t('end.bestWinStreakTip', { n: 2 }));
    expect(endBestWinStreakTipLine()).toBe('Best streak · 2');
    expect(endBestWinStreakTipLine()).toMatch(/^Best streak \u00b7 /);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
  });

  it('localizes Played middot for pt-BR and es; stays distinct from Record / Streak / Win rate / Best streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe('Jogadas · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(endGamesPlayedTipLine()).toBe(lobbyGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(pauseGamesPlayedTipLine(2));
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinRateTipLine()).toMatch(/^Taxa \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toMatch(/^Melhor sequência \u00b7 /);

    setLocale('es');
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe('Jugadas · 2');
    expect(endGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(endGamesPlayedTipLine()).toBe(lobbyGamesPlayedTipLine());
    expect(endGamesPlayedTipLine()).toBe(pauseGamesPlayedTipLine(2));
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endWinStreakTipLine());
    expect(endWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 100 }));
    expect(endWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    expect(endGamesPlayedTipLine()).not.toBe(endBestWinStreakTipLine());
    expect(endBestWinStreakTipLine()).toMatch(/^Mejor racha \u00b7 /);
    setLocale('en-GB');
  });
});
