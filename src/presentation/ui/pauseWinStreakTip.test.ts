import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endWinStreakTipLine } from './endWinStreakTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';
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

describe('pauseWinStreakTipLine', () => {
  it('is null when streak is not positive', () => {
    expect(pauseWinStreakTipLine(0)).toBeNull();
    expect(pauseWinStreakTipLine(-1)).toBeNull();
  });

  it('labels Streak · n with middot, distinct from Loss streak · / Best streak · / Win rate · / Best APM · / Record ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe('Streak · 2');
    expect(pauseWinStreakTipLine(2)).toMatch(/^Streak \u00b7 /);
    // Same en copy as lobby/end tips; distinct i18n key / surface.
    expect(pauseWinStreakTipLine(2)).toBe(lobbyWinStreakTipLine());
    expect(pauseWinStreakTipLine(2)).toBe(endWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    // Distinct from peer career tips (pause Loss / Best streak / Win rate / Best APM; lobby Record).
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(t('pause.lossStreakTip', { n: 2 }));
    expect(pauseLossStreakTipLine(2)).toBe('Loss streak · 2');
    expect(pauseLossStreakTipLine(2)).toMatch(/^Loss streak \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toBe('Best streak · 2');
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Best streak \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseWinRateTipLine(2, 2)).toMatch(/^Win rate \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseBestApmTipLine(90));
    expect(pauseBestApmTipLine(90)).toBe(t('pause.bestApmTip', { n: 90 }));
    expect(pauseBestApmTipLine(90)).toMatch(/^Best APM \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toBe('Record · 2–0');
    expect(lobbyRecordTipLine()).toMatch(/^Record \u00b7 /);
  });

  it('localizes Streak middot for pt-BR and es; stays distinct from Loss streak / Best streak / Win rate / Best APM / Record', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, true);
    setLocale('pt-BR');
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe('Sequência · 2');
    expect(pauseWinStreakTipLine(2)).toMatch(/^Sequência \u00b7 /);
    expect(pauseWinStreakTipLine(2)).toBe(lobbyWinStreakTipLine());
    expect(pauseWinStreakTipLine(2)).toBe(endWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(
      t('pause.lossStreakTip', { n: 2 }),
    );
    expect(pauseLossStreakTipLine(2)).toMatch(/^Sequência de derrotas \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Melhor sequência \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseBestApmTipLine(48));
    expect(pauseBestApmTipLine(48)).toBe(t('pause.bestApmTip', { n: 48 }));
    expect(pauseWinStreakTipLine(2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Recorde \u00b7 /);

    setLocale('es');
    expect(pauseWinStreakTipLine(2)).toBe(t('pause.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).toBe('Racha · 2');
    expect(pauseWinStreakTipLine(2)).toMatch(/^Racha \u00b7 /);
    expect(pauseWinStreakTipLine(2)).toBe(lobbyWinStreakTipLine());
    expect(pauseWinStreakTipLine(2)).toBe(endWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 2 }));
    expect(endWinStreakTipLine()).toBe(t('end.winStreakTip', { n: 2 }));
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseLossStreakTipLine(2));
    expect(pauseLossStreakTipLine(2)).toBe(
      t('pause.lossStreakTip', { n: 2 }),
    );
    expect(pauseLossStreakTipLine(2)).toMatch(/^Racha de derrotas \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseBestWinStreakTipLine(2));
    expect(pauseBestWinStreakTipLine(2)).toBe(
      t('pause.bestWinStreakTip', { n: 2 }),
    );
    expect(pauseBestWinStreakTipLine(2)).toMatch(/^Mejor racha \u00b7 /);
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseWinRateTipLine(2, 2));
    expect(pauseWinRateTipLine(2, 2)).toBe(t('pause.winRateTip', { n: 100 }));
    expect(pauseWinStreakTipLine(2)).not.toBe(pauseBestApmTipLine(48));
    expect(pauseBestApmTipLine(48)).toBe(t('pause.bestApmTip', { n: 48 }));
    expect(pauseWinStreakTipLine(2)).not.toBe(lobbyRecordTipLine());
    expect(lobbyRecordTipLine()).toBe(t('lobby.recordTip', { w: 2, l: 0 }));
    expect(lobbyRecordTipLine()).toMatch(/^Récord \u00b7 /);
    setLocale('en-GB');
  });
});
