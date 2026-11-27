import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endEfficiencyTipLine, matchEfficiencyPct } from './endEfficiencyTip';
import { endKillsTipLine } from './endKillsTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';
import { endWinRateTipLine } from './endWinRateTip';

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

describe('matchEfficiencyPct', () => {
  it('is kills / (kills + losses) as a whole percent', () => {
    expect(matchEfficiencyPct(3, 1)).toBe(75);
    expect(matchEfficiencyPct(0, 4)).toBe(0);
    expect(matchEfficiencyPct(5, 0)).toBe(100);
    expect(matchEfficiencyPct(0, 0)).toBeNull();
  });
});

describe('endEfficiencyTipLine', () => {
  it('labels Efficiency · pct% with middot, distinct from Kills · / Lost · / Win rate · / kill-ratio', () => {
    expect(endEfficiencyTipLine(3, 1)).toBe(t('end.efficiencyTip', { pct: 75 }));
    expect(endEfficiencyTipLine(3, 1)).toBe('Efficiency · 75%');
    expect(endEfficiencyTipLine(3, 1)).toMatch(/^Efficiency \u00b7 /);
    expect(endEfficiencyTipLine(3, 1)).toContain(' \u00b7 ');
    expect(endEfficiencyTipLine(3, 1)).toMatch(/%$/);
    expect(endEfficiencyTipLine(0, 0)).toBeNull();

    const line = endEfficiencyTipLine(3, 1);
    // Distinct from combat count peers (Kills · / Lost ·).
    expect(line).not.toBe(endKillsTipLine(3));
    expect(endKillsTipLine(3)).toBe(t('end.killsTip', { n: 3 }));
    expect(endKillsTipLine(3)).toBe('Kills · 3');
    expect(endKillsTipLine(3)).toMatch(/^Kills \u00b7 /);
    expect(line).not.toBe(endUnitsLostTipLine(1));
    expect(endUnitsLostTipLine(1)).toBe(t('end.lostTip', { n: 1 }));
    expect(endUnitsLostTipLine(1)).toBe('Lost · 1');
    expect(endUnitsLostTipLine(1)).toMatch(/^Lost \u00b7 /);
    // Distinct from career Win rate · (same % framing, different meaning).
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(line).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe('Win rate · 50%');
    expect(endWinRateTipLine()).toMatch(/^Win rate \u00b7 /);
    // Distinct from kill-ratio line (Kills n · Losses n — no Efficiency label).
    expect(line).not.toBe(t('end.killRatio', { kills: 3, losses: 1 }));
    expect(t('end.killRatio', { kills: 3, losses: 1 })).toBe(
      'Kills 3 · Losses 1',
    );
    expect(line).not.toMatch(/^Kills \u00b7 /);
    expect(line).not.toMatch(/^Lost \u00b7 /);
    expect(line).not.toMatch(/^Win rate \u00b7 /);
  });

  it('localizes Efficiency · pct% middot for pt-BR and es; stays distinct from Kills / Lost / Win rate / kill-ratio', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    const pt = endEfficiencyTipLine(3, 1);
    expect(pt).toBe(t('end.efficiencyTip', { pct: 75 }));
    expect(pt).toBe('Eficiência · 75%');
    expect(pt).toMatch(/^Eficiência \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).toMatch(/%$/);
    expect(pt).not.toBe(endKillsTipLine(3));
    expect(endKillsTipLine(3)).toBe(t('end.killsTip', { n: 3 }));
    expect(endKillsTipLine(3)).toBe('Abates · 3');
    expect(endKillsTipLine(3)).toMatch(/^Abates \u00b7 /);
    expect(pt).not.toBe(endUnitsLostTipLine(1));
    expect(endUnitsLostTipLine(1)).toBe(t('end.lostTip', { n: 1 }));
    expect(endUnitsLostTipLine(1)).toBe('Perdidos · 1');
    expect(endUnitsLostTipLine(1)).toMatch(/^Perdidos \u00b7 /);
    expect(pt).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe('Taxa · 50%');
    expect(endWinRateTipLine()).toMatch(/^Taxa \u00b7 /);
    expect(pt).not.toBe(t('end.killRatio', { kills: 3, losses: 1 }));
    expect(t('end.killRatio', { kills: 3, losses: 1 })).toBe(
      'Abates 3 · Perdas 1',
    );

    setLocale('es');
    const es = endEfficiencyTipLine(3, 1);
    expect(es).toBe(t('end.efficiencyTip', { pct: 75 }));
    expect(es).toBe('Eficiencia · 75%');
    expect(es).toMatch(/^Eficiencia \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).toMatch(/%$/);
    expect(es).not.toBe(endKillsTipLine(3));
    expect(endKillsTipLine(3)).toBe(t('end.killsTip', { n: 3 }));
    expect(endKillsTipLine(3)).toBe('Bajas · 3');
    expect(endKillsTipLine(3)).toMatch(/^Bajas \u00b7 /);
    expect(es).not.toBe(endUnitsLostTipLine(1));
    expect(endUnitsLostTipLine(1)).toBe(t('end.lostTip', { n: 1 }));
    expect(endUnitsLostTipLine(1)).toBe('Perdidos · 1');
    expect(endUnitsLostTipLine(1)).toMatch(/^Perdidos \u00b7 /);
    expect(es).not.toBe(endWinRateTipLine());
    expect(endWinRateTipLine()).toBe(t('end.winRateTip', { n: 50 }));
    expect(endWinRateTipLine()).toBe('Tasa · 50%');
    expect(endWinRateTipLine()).toMatch(/^Tasa \u00b7 /);
    expect(es).not.toBe(t('end.killRatio', { kills: 3, losses: 1 }));
    expect(t('end.killRatio', { kills: 3, losses: 1 })).toBe(
      'Bajas 3 · Pérdidas 1',
    );
    setLocale('en-GB');
  });
});
