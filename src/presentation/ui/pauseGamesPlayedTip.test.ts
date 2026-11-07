import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endGamesPlayedTipLine } from './endGamesPlayedTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { pauseBestWinStreakTipLine } from './pauseBestWinStreakTip';
import { pauseGamesPlayedTipLine } from './pauseGamesPlayedTip';
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

describe('pauseGamesPlayedTipLine', () => {
  it('is null when played is not positive', () => {
    expect(pauseGamesPlayedTipLine(0)).toBeNull();
    expect(pauseGamesPlayedTipLine(-1)).toBeNull();
  });

  it('labels Played · n with middot, distinct from Win rate · / Record · / Streak · / Best streak ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe('Played · 2');
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Played \u00b7 /);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseGamesPlayedTipLine(2)).toBe(lobbyGamesPlayedTipLine());
    expect(pauseGamesPlayedTipLine(2)).toBe(endGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    // Distinct from peer career tips (pause Win rate / Streak / Best streak; lobby Record).
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toBe('Win rate · 100%');
    expect(pauseWinRateTipLine(2, 2)).toMatch(/^Win rate \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe('Streak · 2');
    expect(pauseWinStreakTipLine(2)).toMatch(/^Streak \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toBe('Best streak · 2');
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Best streak \u00b7 /);
  });

  it('localizes Played middot for pt-BR and es; stays distinct from Win rate / Record / Streak / Best streak', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);

    setLocale('pt-BR');
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe('Jogadas · 2');
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Jogadas \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).toBe(lobbyGamesPlayedTipLine());
    expect(pauseGamesPlayedTipLine(2)).toBe(endGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toMatch(/^Taxa \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Sequência \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Melhor sequência \u00b7 /);

    setLocale('es');
    expect(pauseGamesPlayedTipLine(2)).toBe(t('pause.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).toBe('Jugadas · 2');
    expect(pauseGamesPlayedTipLine(2)).toMatch(/^Jugadas \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).toBe(lobbyGamesPlayedTipLine());
    expect(pauseGamesPlayedTipLine(2)).toBe(endGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 2 }));
    expect(endGamesPlayedTipLine()).toBe(t('end.gamesPlayedTip', { n: 2 }));
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toMatch(/^Tasa \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseWinStreakTipLine(2));
    expect(pauseWinStreakTipLine(2)).toMatch(/^Racha \u00b7 /);
    expect(pauseGamesPlayedTipLine(2)).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Mejor racha \u00b7 /);
    setLocale('en-GB');
  });
});
