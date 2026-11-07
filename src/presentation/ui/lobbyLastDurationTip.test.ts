import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endDurationTipLine } from './endDurationTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
import { lobbyMatchLengthTipLine } from './lobbyPanel';

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

describe('lobbyLastDurationTipLine', () => {
  it('returns null when prefs have no last duration', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing');
    expect(lobbyLastDurationTipLine()).toBeNull();
  });

  it('labels Last · mm:ss with middot, distinct from Best · / Avg time · / Time · / Last · peers', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 125_000, true);
    const lastClock = formatMatchClock(125_000);
    const line = lobbyLastDurationTipLine();
    expect(line).toBe(t('lobby.lastDurationTip', { clock: lastClock }));
    expect(line).toBe('Last · 2:05');
    expect(line).toMatch(/^Last \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    expect(line).toContain(lastClock);
    // Distinct from peer duration tips (Best · / Avg time · / Time · / ~min).
    expect(line).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyBestDurationTipLine()).toBe('Best · 1:30');
    expect(lobbyBestDurationTipLine()).toMatch(/^Best \u00b7 /);
    expect(line).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toBe(
      t('lobby.avgDurationTip', { clock: formatMatchClock(107_500) }),
    );
    expect(lobbyAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);
    expect(line).not.toBe(endDurationTipLine(125_000));
    expect(endDurationTipLine(125_000)).toBe(
      t('end.durationTip', { clock: lastClock }),
    );
    expect(endDurationTipLine(125_000)).toBe('Time · 2:05');
    expect(endDurationTipLine(125_000)).toMatch(/^Time \u00b7 /);
    expect(line).not.toBe(lobbyMatchLengthTipLine());
    // Distinct from same-prefix Last · Won / Last · faction peers.
    expect(line).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toBe('Last · Won');
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Last \u00b7 Won$/);
    expect(line).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('nobles').name }),
    );
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);
    expect(line).not.toMatch(/^Best \u00b7 /);
    expect(line).not.toMatch(/^Avg time \u00b7 /);
    expect(line).not.toMatch(/^Time \u00b7 /);
  });

  it('keeps last duration when prefs are remembered without a new clock', () => {
    rememberMatchPrefs('brutes', 'normal', 'ridge', 90_000);
    rememberMatchPrefs('nobles', 'easy', 'gap');
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyLastDurationTipLine()).toBe('Last · 1:30');
    expect(lobbyLastDurationTipLine()).toMatch(/^Last \u00b7 /);
  });

  it('localizes Last · mm:ss middot for pt-BR and es; stays distinct from Best / Avg / Time / Last peers', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 125_000, true);
    const lastClock = formatMatchClock(125_000);

    setLocale('pt-BR');
    const pt = lobbyLastDurationTipLine();
    expect(pt).toBe(t('lobby.lastDurationTip', { clock: lastClock }));
    expect(pt).toBe('Última · 2:05');
    expect(pt).toMatch(/^Última \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyBestDurationTipLine()).toMatch(/^Melhor \u00b7 /);
    expect(pt).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toBe(endDurationTipLine(125_000));
    expect(endDurationTipLine(125_000)).toMatch(/^Tempo \u00b7 /);
    expect(pt).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Última \u00b7 Vitória$/);
    expect(pt).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(pt).not.toMatch(/^Melhor \u00b7 /);
    expect(pt).not.toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^Tempo \u00b7 /);

    setLocale('es');
    const es = lobbyLastDurationTipLine();
    expect(es).toBe(t('lobby.lastDurationTip', { clock: lastClock }));
    expect(es).toBe('Última · 2:05');
    expect(es).toMatch(/^Última \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(lobbyBestDurationTipLine());
    expect(lobbyBestDurationTipLine()).toBe(
      t('lobby.bestDurationTip', { clock: formatMatchClock(90_000) }),
    );
    expect(lobbyBestDurationTipLine()).toMatch(/^Mejor \u00b7 /);
    expect(es).not.toBe(lobbyAvgDurationTipLine());
    expect(lobbyAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toBe(endDurationTipLine(125_000));
    expect(endDurationTipLine(125_000)).toMatch(/^Tiempo \u00b7 /);
    expect(es).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Última \u00b7 Victoria$/);
    expect(es).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    expect(es).not.toMatch(/^Mejor \u00b7 /);
    expect(es).not.toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^Tiempo \u00b7 /);
    setLocale('en-GB');
  });
});
