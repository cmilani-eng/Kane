import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endBuildingsLostTipLine } from './endBuildingsLostTip';
import { endEfficiencyTipLine } from './endEfficiencyTip';
import { endKillsTipLine } from './endKillsTip';
import { endLossesTipLine } from './endLossesTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';

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

describe('endUnitsLostTipLine', () => {
  it('labels Lost · n with middot, distinct from Kills · / Razed · / Efficiency · / Losses · / kill-ratio', () => {
    expect(endUnitsLostTipLine(7)).toBe(t('end.lostTip', { n: 7 }));
    expect(endUnitsLostTipLine(7)).toBe('Lost · 7');
    expect(endUnitsLostTipLine(7)).toMatch(/^Lost \u00b7 /);
    expect(endUnitsLostTipLine(7)).toContain(' \u00b7 ');
    expect(endUnitsLostTipLine(0)).toBe(t('end.lostTip', { n: 0 }));
    expect(endUnitsLostTipLine(0)).toBe('Lost · 0');
    expect(endUnitsLostTipLine(0)).toMatch(/^Lost \u00b7 /);
    expect(endUnitsLostTipLine(-3)).toBe('Lost · 0');
    expect(endUnitsLostTipLine(2.9)).toBe('Lost · 2');

    const line = endUnitsLostTipLine(7);
    // Distinct from combat count peers (Kills · / Razed ·).
    expect(line).not.toBe(endKillsTipLine(7));
    expect(endKillsTipLine(7)).toBe(t('end.killsTip', { n: 7 }));
    expect(endKillsTipLine(7)).toBe('Kills · 7');
    expect(endKillsTipLine(7)).toMatch(/^Kills \u00b7 /);
    expect(line).not.toBe(endBuildingsLostTipLine(7));
    expect(endBuildingsLostTipLine(7)).toBe(t('end.bldLostTip', { n: 7 }));
    expect(endBuildingsLostTipLine(7)).toBe('Razed · 7');
    expect(endBuildingsLostTipLine(7)).toMatch(/^Razed \u00b7 /);
    // Distinct from Efficiency · (same combat inputs, % framing).
    expect(line).not.toBe(endEfficiencyTipLine(3, 7));
    expect(endEfficiencyTipLine(3, 7)).toBe(t('end.efficiencyTip', { pct: 30 }));
    expect(endEfficiencyTipLine(3, 7)).toBe('Efficiency · 30%');
    expect(endEfficiencyTipLine(3, 7)).toMatch(/^Efficiency \u00b7 /);
    // Distinct from career Losses · (match unit removals vs career W–L).
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    expect(line).not.toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).toBe('Losses · 1');
    expect(endLossesTipLine()).toMatch(/^Losses \u00b7 /);
    // Distinct from kill-ratio line (Kills n · Losses n — no Lost · label alone).
    expect(line).not.toBe(t('end.killRatio', { kills: 3, losses: 7 }));
    expect(t('end.killRatio', { kills: 3, losses: 7 })).toBe(
      'Kills 3 · Losses 7',
    );
    expect(line).not.toMatch(/^Kills \u00b7 /);
    expect(line).not.toMatch(/^Razed \u00b7 /);
    expect(line).not.toMatch(/^Efficiency \u00b7 /);
    expect(line).not.toMatch(/^Losses \u00b7 /);
  });

  it('localizes Lost · n middot for pt-BR and es; stays distinct from Kills / Razed / Efficiency / Losses / kill-ratio', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);

    setLocale('pt-BR');
    const pt = endUnitsLostTipLine(7);
    expect(pt).toBe(t('end.lostTip', { n: 7 }));
    expect(pt).toBe('Perdidos · 7');
    expect(pt).toMatch(/^Perdidos \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(endKillsTipLine(7));
    expect(endKillsTipLine(7)).toBe(t('end.killsTip', { n: 7 }));
    expect(endKillsTipLine(7)).toBe('Abates · 7');
    expect(endKillsTipLine(7)).toMatch(/^Abates \u00b7 /);
    expect(pt).not.toBe(endBuildingsLostTipLine(7));
    expect(endBuildingsLostTipLine(7)).toBe(t('end.bldLostTip', { n: 7 }));
    expect(endBuildingsLostTipLine(7)).toBe('Derrubados · 7');
    expect(endBuildingsLostTipLine(7)).toMatch(/^Derrubados \u00b7 /);
    expect(pt).not.toBe(endEfficiencyTipLine(3, 7));
    expect(endEfficiencyTipLine(3, 7)).toBe(t('end.efficiencyTip', { pct: 30 }));
    expect(endEfficiencyTipLine(3, 7)).toBe('Eficiência · 30%');
    expect(endEfficiencyTipLine(3, 7)).toMatch(/^Eficiência \u00b7 /);
    expect(pt).not.toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(pt).not.toBe(t('end.killRatio', { kills: 3, losses: 7 }));
    expect(t('end.killRatio', { kills: 3, losses: 7 })).toBe(
      'Abates 3 · Perdas 7',
    );

    setLocale('es');
    const es = endUnitsLostTipLine(7);
    expect(es).toBe(t('end.lostTip', { n: 7 }));
    expect(es).toBe('Perdidos · 7');
    expect(es).toMatch(/^Perdidos \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(endKillsTipLine(7));
    expect(endKillsTipLine(7)).toBe(t('end.killsTip', { n: 7 }));
    expect(endKillsTipLine(7)).toBe('Bajas · 7');
    expect(endKillsTipLine(7)).toMatch(/^Bajas \u00b7 /);
    expect(es).not.toBe(endBuildingsLostTipLine(7));
    expect(endBuildingsLostTipLine(7)).toBe(t('end.bldLostTip', { n: 7 }));
    expect(endBuildingsLostTipLine(7)).toBe('Arrasados · 7');
    expect(endBuildingsLostTipLine(7)).toMatch(/^Arrasados \u00b7 /);
    expect(es).not.toBe(endEfficiencyTipLine(3, 7));
    expect(endEfficiencyTipLine(3, 7)).toBe(t('end.efficiencyTip', { pct: 30 }));
    expect(endEfficiencyTipLine(3, 7)).toBe('Eficiencia · 30%');
    expect(endEfficiencyTipLine(3, 7)).toMatch(/^Eficiencia \u00b7 /);
    expect(es).not.toBe(endLossesTipLine());
    expect(endLossesTipLine()).toBe(t('end.lossesTip', { n: 1 }));
    expect(endLossesTipLine()).toMatch(/^Derrotas \u00b7 /);
    expect(es).not.toBe(t('end.killRatio', { kills: 3, losses: 7 }));
    expect(t('end.killRatio', { kills: 3, losses: 7 })).toBe(
      'Bajas 3 · Pérdidas 7',
    );
    setLocale('en-GB');
  });
});
