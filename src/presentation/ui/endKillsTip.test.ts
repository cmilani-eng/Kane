import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { endBuildingsLostTipLine } from './endBuildingsLostTip';
import { endEfficiencyTipLine } from './endEfficiencyTip';
import { endKillsTipLine } from './endKillsTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('endKillsTipLine', () => {
  it('labels Kills · n with middot, distinct from Lost · / Razed · / Efficiency · / kill-ratio', () => {
    expect(endKillsTipLine(7)).toBe(t('end.killsTip', { n: 7 }));
    expect(endKillsTipLine(7)).toBe('Kills · 7');
    expect(endKillsTipLine(7)).toMatch(/^Kills \u00b7 /);
    expect(endKillsTipLine(7)).toContain(' \u00b7 ');
    expect(endKillsTipLine(0)).toBe(t('end.killsTip', { n: 0 }));
    expect(endKillsTipLine(0)).toBe('Kills · 0');
    expect(endKillsTipLine(0)).toMatch(/^Kills \u00b7 /);
    expect(endKillsTipLine(-3)).toBe('Kills · 0');
    expect(endKillsTipLine(2.9)).toBe('Kills · 2');

    const line = endKillsTipLine(7);
    // Distinct from combat count peers (Lost · / Razed ·).
    expect(line).not.toBe(endUnitsLostTipLine(7));
    expect(endUnitsLostTipLine(7)).toBe(t('end.lostTip', { n: 7 }));
    expect(endUnitsLostTipLine(7)).toBe('Lost · 7');
    expect(endUnitsLostTipLine(7)).toMatch(/^Lost \u00b7 /);
    expect(line).not.toBe(endBuildingsLostTipLine(7));
    expect(endBuildingsLostTipLine(7)).toBe(t('end.bldLostTip', { n: 7 }));
    expect(endBuildingsLostTipLine(7)).toBe('Razed · 7');
    expect(endBuildingsLostTipLine(7)).toMatch(/^Razed \u00b7 /);
    // Distinct from Efficiency · (same combat inputs, % framing).
    expect(line).not.toBe(endEfficiencyTipLine(7, 3));
    expect(endEfficiencyTipLine(7, 3)).toBe(t('end.efficiencyTip', { pct: 70 }));
    expect(endEfficiencyTipLine(7, 3)).toBe('Efficiency · 70%');
    expect(endEfficiencyTipLine(7, 3)).toMatch(/^Efficiency \u00b7 /);
    // Distinct from kill-ratio line (Kills n · Losses n — no Kills · label alone).
    expect(line).not.toBe(t('end.killRatio', { kills: 7, losses: 3 }));
    expect(t('end.killRatio', { kills: 7, losses: 3 })).toBe(
      'Kills 7 · Losses 3',
    );
    expect(line).not.toMatch(/^Lost \u00b7 /);
    expect(line).not.toMatch(/^Razed \u00b7 /);
    expect(line).not.toMatch(/^Efficiency \u00b7 /);
  });

  it('localizes Kills · n middot for pt-BR and es; stays distinct from Lost / Razed / Efficiency / kill-ratio', () => {
    setLocale('pt-BR');
    const pt = endKillsTipLine(7);
    expect(pt).toBe(t('end.killsTip', { n: 7 }));
    expect(pt).toBe('Abates · 7');
    expect(pt).toMatch(/^Abates \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(endUnitsLostTipLine(7));
    expect(endUnitsLostTipLine(7)).toBe(t('end.lostTip', { n: 7 }));
    expect(endUnitsLostTipLine(7)).toBe('Perdidos · 7');
    expect(endUnitsLostTipLine(7)).toMatch(/^Perdidos \u00b7 /);
    expect(pt).not.toBe(endBuildingsLostTipLine(7));
    expect(endBuildingsLostTipLine(7)).toBe(t('end.bldLostTip', { n: 7 }));
    expect(endBuildingsLostTipLine(7)).toBe('Derrubados · 7');
    expect(endBuildingsLostTipLine(7)).toMatch(/^Derrubados \u00b7 /);
    expect(pt).not.toBe(endEfficiencyTipLine(7, 3));
    expect(endEfficiencyTipLine(7, 3)).toBe(t('end.efficiencyTip', { pct: 70 }));
    expect(endEfficiencyTipLine(7, 3)).toBe('Eficiência · 70%');
    expect(endEfficiencyTipLine(7, 3)).toMatch(/^Eficiência \u00b7 /);
    expect(pt).not.toBe(t('end.killRatio', { kills: 7, losses: 3 }));
    expect(t('end.killRatio', { kills: 7, losses: 3 })).toBe(
      'Abates 7 · Perdas 3',
    );

    setLocale('es');
    const es = endKillsTipLine(7);
    expect(es).toBe(t('end.killsTip', { n: 7 }));
    expect(es).toBe('Bajas · 7');
    expect(es).toMatch(/^Bajas \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(endUnitsLostTipLine(7));
    expect(endUnitsLostTipLine(7)).toBe(t('end.lostTip', { n: 7 }));
    expect(endUnitsLostTipLine(7)).toBe('Perdidos · 7');
    expect(endUnitsLostTipLine(7)).toMatch(/^Perdidos \u00b7 /);
    expect(es).not.toBe(endBuildingsLostTipLine(7));
    expect(endBuildingsLostTipLine(7)).toBe(t('end.bldLostTip', { n: 7 }));
    expect(endBuildingsLostTipLine(7)).toBe('Arrasados · 7');
    expect(endBuildingsLostTipLine(7)).toMatch(/^Arrasados \u00b7 /);
    expect(es).not.toBe(endEfficiencyTipLine(7, 3));
    expect(endEfficiencyTipLine(7, 3)).toBe(t('end.efficiencyTip', { pct: 70 }));
    expect(endEfficiencyTipLine(7, 3)).toBe('Eficiencia · 70%');
    expect(endEfficiencyTipLine(7, 3)).toMatch(/^Eficiencia \u00b7 /);
    expect(es).not.toBe(t('end.killRatio', { kills: 7, losses: 3 }));
    expect(t('end.killRatio', { kills: 7, losses: 3 })).toBe(
      'Bajas 7 · Pérdidas 3',
    );
    setLocale('en-GB');
  });
});
