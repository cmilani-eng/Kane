import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';

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

describe('lobbyLastOutcomeTipLine', () => {
  it('returns null when prefs have no last outcome', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLastOutcomeTipLine()).toBeNull();
  });

  it('labels Last · Won / Lost with middot, distinct from Last · duration / faction / Streak · / Wins ·', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    const win = lobbyLastOutcomeTipLine();
    expect(win).toBe(t('lobby.lastOutcomeWin'));
    expect(win).toBe('Last · Won');
    expect(win).toMatch(/^Last \u00b7 Won$/);
    expect(win).toContain(' \u00b7 ');
    // Distinct from peer Last · / Streak · / Wins · chips.
    expect(win).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyLastDurationTipLine()).toBe('Last · 1:30');
    expect(lobbyLastDurationTipLine()).toMatch(/^Last \u00b7 /);
    expect(win).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('weirdos').name }),
    );
    expect(lobbyLastFactionTipLine()).toBe('Last · The Weirdos');
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);
    expect(win).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyWinStreakTipLine()).toBe('Streak · 1');
    expect(lobbyWinStreakTipLine()).toMatch(/^Streak \u00b7 /);
    expect(win).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toBe('Wins · 1');
    expect(lobbyWinsTipLine()).toMatch(/^Wins \u00b7 /);

    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    const loss = lobbyLastOutcomeTipLine();
    expect(loss).toBe(t('lobby.lastOutcomeLoss'));
    expect(loss).toBe('Last · Lost');
    expect(loss).toMatch(/^Last \u00b7 Lost$/);
    expect(loss).toContain(' \u00b7 ');
    expect(loss).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(60_000) }),
    );
    expect(lobbyLastDurationTipLine()).toBe('Last · 1:00');
    expect(lobbyLastDurationTipLine()).toMatch(/^Last \u00b7 /);
    expect(loss).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('brutes').name }),
    );
    expect(lobbyLastFactionTipLine()).toBe('Last · The Brutes');
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);
    expect(loss).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBeNull();
    expect(loss).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toBe('Losses · 1');
    expect(lobbyLossesTipLine()).toMatch(/^Losses \u00b7 /);
  });

  it('keeps last outcome when prefs are remembered without a new result', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 80_000, true);
    rememberMatchPrefs('weirdos', 'hard', 'gap');
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toBe('Last · Won');
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Last \u00b7 Won$/);
  });

  it('localizes Last · Won/Lost middot for pt-BR and es; stays distinct from Last / Streak / Wins', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);

    setLocale('pt-BR');
    const ptWin = lobbyLastOutcomeTipLine();
    expect(ptWin).toBe(t('lobby.lastOutcomeWin'));
    expect(ptWin).toBe('Última · Vitória');
    expect(ptWin).toMatch(/^Última \u00b7 Vitória$/);
    expect(ptWin).toContain(' \u00b7 ');
    expect(ptWin).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(ptWin).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('weirdos').name }),
    );
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(ptWin).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyWinStreakTipLine()).toMatch(/^Sequência \u00b7 /);
    expect(ptWin).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 1 }));
    expect(lobbyWinsTipLine()).toMatch(/^Vitórias \u00b7 /);

    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    const ptLoss = lobbyLastOutcomeTipLine();
    expect(ptLoss).toBe(t('lobby.lastOutcomeLoss'));
    expect(ptLoss).toBe('Última · Derrota');
    expect(ptLoss).toMatch(/^Última \u00b7 Derrota$/);
    expect(ptLoss).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(ptLoss).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(ptLoss).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 1 }));
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);

    // Reset outcome to win for es locale (same prefs stack: 1W 1L, last = loss).
    // Re-seed a win so es asserts cover both keys.
    rememberMatchPrefs('nobles', 'normal', 'gap', 70_000, true);

    setLocale('es');
    const esWin = lobbyLastOutcomeTipLine();
    expect(esWin).toBe(t('lobby.lastOutcomeWin'));
    expect(esWin).toBe('Última · Victoria');
    expect(esWin).toMatch(/^Última \u00b7 Victoria$/);
    expect(esWin).toContain(' \u00b7 ');
    expect(esWin).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(70_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(esWin).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('nobles').name }),
    );
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(esWin).not.toBe(lobbyWinStreakTipLine());
    expect(lobbyWinStreakTipLine()).toBe(t('lobby.winStreakTip', { n: 1 }));
    expect(lobbyWinStreakTipLine()).toMatch(/^Racha \u00b7 /);
    expect(esWin).not.toBe(lobbyWinsTipLine());
    expect(lobbyWinsTipLine()).toBe(t('lobby.winsTip', { n: 2 }));
    expect(lobbyWinsTipLine()).toMatch(/^Victorias \u00b7 /);

    rememberMatchPrefs('brutes', 'hard', 'ridge', 55_000, false);
    const esLoss = lobbyLastOutcomeTipLine();
    expect(esLoss).toBe(t('lobby.lastOutcomeLoss'));
    expect(esLoss).toBe('Última · Derrota');
    expect(esLoss).toMatch(/^Última \u00b7 Derrota$/);
    expect(esLoss).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(esLoss).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(esLoss).not.toBe(lobbyLossesTipLine());
    expect(lobbyLossesTipLine()).toBe(t('lobby.lossesTip', { n: 2 }));
    expect(lobbyLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    setLocale('en-GB');
  });
});
