import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { endBuildingsLostTipLine } from './endBuildingsLostTip';
import { endBuildingsRaisedTipLine } from './endBuildingsRaisedTip';
import { endEfficiencyTipLine } from './endEfficiencyTip';
import { endKillsTipLine } from './endKillsTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('endBuildingsLostTipLine', () => {
  it('labels Razed · n with middot, distinct from Lost · / Kills · / Raised · / Efficiency · / kill-ratio', () => {
    expect(endBuildingsLostTipLine(2)).toBe(t('end.bldLostTip', { n: 2 }));
    expect(endBuildingsLostTipLine(2)).toBe('Razed · 2');
    expect(endBuildingsLostTipLine(2)).toMatch(/^Razed \u00b7 /);
    expect(endBuildingsLostTipLine(2)).toContain(' \u00b7 ');
    expect(endBuildingsLostTipLine(0)).toBe(t('end.bldLostTip', { n: 0 }));
    expect(endBuildingsLostTipLine(0)).toBe('Razed · 0');
    expect(endBuildingsLostTipLine(0)).toMatch(/^Razed \u00b7 /);
    expect(endBuildingsLostTipLine(-3)).toBe('Razed · 0');
    expect(endBuildingsLostTipLine(2.9)).toBe('Razed · 2');

    const line = endBuildingsLostTipLine(2);
    // Distinct from combat count peers (Lost · / Kills ·).
    expect(line).not.toBe(endUnitsLostTipLine(2));
    expect(endUnitsLostTipLine(2)).toBe(t('end.lostTip', { n: 2 }));
    expect(endUnitsLostTipLine(2)).toBe('Lost · 2');
    expect(endUnitsLostTipLine(2)).toMatch(/^Lost \u00b7 /);
    expect(line).not.toBe(endKillsTipLine(2));
    expect(endKillsTipLine(2)).toBe(t('end.killsTip', { n: 2 }));
    expect(endKillsTipLine(2)).toBe('Kills · 2');
    expect(endKillsTipLine(2)).toMatch(/^Kills \u00b7 /);
    // Distinct from Raised · (buildings constructed vs destroyed).
    expect(line).not.toBe(endBuildingsRaisedTipLine(2));
    expect(endBuildingsRaisedTipLine(2)).toBe(t('end.raisedTip', { n: 2 }));
    expect(endBuildingsRaisedTipLine(2)).toBe('Raised · 2');
    expect(endBuildingsRaisedTipLine(2)).toMatch(/^Raised \u00b7 /);
    // Distinct from Efficiency · (same combat inputs, % framing).
    expect(line).not.toBe(endEfficiencyTipLine(7, 3));
    expect(endEfficiencyTipLine(7, 3)).toBe(t('end.efficiencyTip', { pct: 70 }));
    expect(endEfficiencyTipLine(7, 3)).toBe('Efficiency · 70%');
    expect(endEfficiencyTipLine(7, 3)).toMatch(/^Efficiency \u00b7 /);
    // Distinct from kill-ratio line (Kills n · Losses n — no Razed · label).
    expect(line).not.toBe(t('end.killRatio', { kills: 7, losses: 3 }));
    expect(t('end.killRatio', { kills: 7, losses: 3 })).toBe(
      'Kills 7 · Losses 3',
    );
    expect(line).not.toMatch(/^Lost \u00b7 /);
    expect(line).not.toMatch(/^Kills \u00b7 /);
    expect(line).not.toMatch(/^Raised \u00b7 /);
    expect(line).not.toMatch(/^Efficiency \u00b7 /);
  });

  it('localizes Razed · n middot for pt-BR and es; stays distinct from Lost / Kills / Raised / Efficiency / kill-ratio', () => {
    setLocale('pt-BR');
    const pt = endBuildingsLostTipLine(2);
    expect(pt).toBe(t('end.bldLostTip', { n: 2 }));
    expect(pt).toBe('Derrubados · 2');
    expect(pt).toMatch(/^Derrubados \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(endUnitsLostTipLine(2));
    expect(endUnitsLostTipLine(2)).toBe(t('end.lostTip', { n: 2 }));
    expect(endUnitsLostTipLine(2)).toBe('Perdidos · 2');
    expect(endUnitsLostTipLine(2)).toMatch(/^Perdidos \u00b7 /);
    expect(pt).not.toBe(endKillsTipLine(2));
    expect(endKillsTipLine(2)).toBe(t('end.killsTip', { n: 2 }));
    expect(endKillsTipLine(2)).toBe('Abates · 2');
    expect(endKillsTipLine(2)).toMatch(/^Abates \u00b7 /);
    expect(pt).not.toBe(endBuildingsRaisedTipLine(2));
    expect(endBuildingsRaisedTipLine(2)).toBe(t('end.raisedTip', { n: 2 }));
    expect(endBuildingsRaisedTipLine(2)).toBe('Erguidos · 2');
    expect(endBuildingsRaisedTipLine(2)).toMatch(/^Erguidos \u00b7 /);
    expect(pt).not.toBe(endEfficiencyTipLine(7, 3));
    expect(endEfficiencyTipLine(7, 3)).toBe(t('end.efficiencyTip', { pct: 70 }));
    expect(endEfficiencyTipLine(7, 3)).toBe('Eficiência · 70%');
    expect(endEfficiencyTipLine(7, 3)).toMatch(/^Eficiência \u00b7 /);
    expect(pt).not.toBe(t('end.killRatio', { kills: 7, losses: 3 }));
    expect(t('end.killRatio', { kills: 7, losses: 3 })).toBe(
      'Abates 7 · Perdas 3',
    );

    setLocale('es');
    const es = endBuildingsLostTipLine(2);
    expect(es).toBe(t('end.bldLostTip', { n: 2 }));
    expect(es).toBe('Arrasados · 2');
    expect(es).toMatch(/^Arrasados \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(endUnitsLostTipLine(2));
    expect(endUnitsLostTipLine(2)).toBe(t('end.lostTip', { n: 2 }));
    expect(endUnitsLostTipLine(2)).toBe('Perdidos · 2');
    expect(endUnitsLostTipLine(2)).toMatch(/^Perdidos \u00b7 /);
    expect(es).not.toBe(endKillsTipLine(2));
    expect(endKillsTipLine(2)).toBe(t('end.killsTip', { n: 2 }));
    expect(endKillsTipLine(2)).toBe('Bajas · 2');
    expect(endKillsTipLine(2)).toMatch(/^Bajas \u00b7 /);
    expect(es).not.toBe(endBuildingsRaisedTipLine(2));
    expect(endBuildingsRaisedTipLine(2)).toBe(t('end.raisedTip', { n: 2 }));
    expect(endBuildingsRaisedTipLine(2)).toBe('Levantados · 2');
    expect(endBuildingsRaisedTipLine(2)).toMatch(/^Levantados \u00b7 /);
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
