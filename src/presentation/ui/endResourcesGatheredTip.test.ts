import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { endBuildingsLostTipLine } from './endBuildingsLostTip';
import { endBuildingsRaisedTipLine } from './endBuildingsRaisedTip';
import { endKillsTipLine } from './endKillsTip';
import { endResourcesGatheredTipLine } from './endResourcesGatheredTip';
import { endUnitsLostTipLine } from './endUnitsLostTip';
import { endUnitsTrainedTipLine } from './endUnitsTrainedTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('endResourcesGatheredTipLine', () => {
  it('labels Gathered · n with middot, distinct from Trained · / Raised · / Lost · / Kills · / Razed · / g/c breakdown', () => {
    expect(endResourcesGatheredTipLine(120, 45)).toBe(
      t('end.gatheredTip', { n: 165 }),
    );
    expect(endResourcesGatheredTipLine(120, 45)).toBe('Gathered · 165');
    expect(endResourcesGatheredTipLine(120, 45)).toMatch(/^Gathered \u00b7 /);
    expect(endResourcesGatheredTipLine(120, 45)).toContain(' \u00b7 ');
    expect(endResourcesGatheredTipLine(0, 0)).toBe(
      t('end.gatheredTip', { n: 0 }),
    );
    expect(endResourcesGatheredTipLine(0, 0)).toBe('Gathered · 0');
    expect(endResourcesGatheredTipLine(0, 0)).toMatch(/^Gathered \u00b7 /);
    expect(endResourcesGatheredTipLine(-3, 5)).toBe('Gathered · 5');
    expect(endResourcesGatheredTipLine(2.9, 1.8)).toBe('Gathered · 3');

    const line = endResourcesGatheredTipLine(2, 1);
    // Distinct from production / combat count peers.
    expect(line).not.toBe(endUnitsTrainedTipLine(3));
    expect(endUnitsTrainedTipLine(3)).toBe(t('end.trainedTip', { n: 3 }));
    expect(endUnitsTrainedTipLine(3)).toBe('Trained · 3');
    expect(endUnitsTrainedTipLine(3)).toMatch(/^Trained \u00b7 /);
    expect(line).not.toBe(endBuildingsRaisedTipLine(3));
    expect(endBuildingsRaisedTipLine(3)).toBe(t('end.raisedTip', { n: 3 }));
    expect(endBuildingsRaisedTipLine(3)).toBe('Raised · 3');
    expect(endBuildingsRaisedTipLine(3)).toMatch(/^Raised \u00b7 /);
    expect(line).not.toBe(endUnitsLostTipLine(3));
    expect(endUnitsLostTipLine(3)).toBe(t('end.lostTip', { n: 3 }));
    expect(endUnitsLostTipLine(3)).toBe('Lost · 3');
    expect(endUnitsLostTipLine(3)).toMatch(/^Lost \u00b7 /);
    expect(line).not.toBe(endKillsTipLine(3));
    expect(endKillsTipLine(3)).toBe(t('end.killsTip', { n: 3 }));
    expect(endKillsTipLine(3)).toBe('Kills · 3');
    expect(endKillsTipLine(3)).toMatch(/^Kills \u00b7 /);
    expect(line).not.toBe(endBuildingsLostTipLine(3));
    expect(endBuildingsLostTipLine(3)).toBe(t('end.bldLostTip', { n: 3 }));
    expect(endBuildingsLostTipLine(3)).toBe('Razed · 3');
    expect(endBuildingsLostTipLine(3)).toMatch(/^Razed \u00b7 /);
    // Distinct from gold/crystal breakdown line (`end.gathered`).
    const breakdown = t('end.gathered', { gold: 2, crystals: 1 });
    expect(line).not.toBe(breakdown);
    expect(breakdown).toMatch(/g · .*c/);
    expect(line).not.toMatch(/g · .*c/);
    expect(line).not.toMatch(/^Trained \u00b7 /);
    expect(line).not.toMatch(/^Raised \u00b7 /);
    expect(line).not.toMatch(/^Lost \u00b7 /);
    expect(line).not.toMatch(/^Kills \u00b7 /);
    expect(line).not.toMatch(/^Razed \u00b7 /);
  });

  it('localizes Gathered · n middot for pt-BR and es; stays distinct from Trained / Raised / Lost / Kills / Razed / g/c breakdown', () => {
    setLocale('pt-BR');
    const pt = endResourcesGatheredTipLine(2, 1);
    expect(pt).toBe(t('end.gatheredTip', { n: 3 }));
    expect(pt).toBe('Coletado · 3');
    expect(pt).toMatch(/^Coletado \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(endUnitsTrainedTipLine(3));
    expect(endUnitsTrainedTipLine(3)).toBe(t('end.trainedTip', { n: 3 }));
    expect(endUnitsTrainedTipLine(3)).toBe('Treinados · 3');
    expect(endUnitsTrainedTipLine(3)).toMatch(/^Treinados \u00b7 /);
    expect(pt).not.toBe(endBuildingsRaisedTipLine(3));
    expect(endBuildingsRaisedTipLine(3)).toBe(t('end.raisedTip', { n: 3 }));
    expect(endBuildingsRaisedTipLine(3)).toBe('Erguidos · 3');
    expect(endBuildingsRaisedTipLine(3)).toMatch(/^Erguidos \u00b7 /);
    expect(pt).not.toBe(endUnitsLostTipLine(3));
    expect(endUnitsLostTipLine(3)).toBe(t('end.lostTip', { n: 3 }));
    expect(endUnitsLostTipLine(3)).toBe('Perdidos · 3');
    expect(endUnitsLostTipLine(3)).toMatch(/^Perdidos \u00b7 /);
    expect(pt).not.toBe(endKillsTipLine(3));
    expect(endKillsTipLine(3)).toBe(t('end.killsTip', { n: 3 }));
    expect(endKillsTipLine(3)).toBe('Abates · 3');
    expect(endKillsTipLine(3)).toMatch(/^Abates \u00b7 /);
    expect(pt).not.toBe(endBuildingsLostTipLine(3));
    expect(endBuildingsLostTipLine(3)).toBe(t('end.bldLostTip', { n: 3 }));
    expect(endBuildingsLostTipLine(3)).toBe('Derrubados · 3');
    expect(endBuildingsLostTipLine(3)).toMatch(/^Derrubados \u00b7 /);
    expect(pt).not.toBe(t('end.gathered', { gold: 2, crystals: 1 }));

    setLocale('es');
    const es = endResourcesGatheredTipLine(2, 1);
    expect(es).toBe(t('end.gatheredTip', { n: 3 }));
    expect(es).toBe('Recogido · 3');
    expect(es).toMatch(/^Recogido \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(endUnitsTrainedTipLine(3));
    expect(endUnitsTrainedTipLine(3)).toBe(t('end.trainedTip', { n: 3 }));
    expect(endUnitsTrainedTipLine(3)).toBe('Entrenados · 3');
    expect(endUnitsTrainedTipLine(3)).toMatch(/^Entrenados \u00b7 /);
    expect(es).not.toBe(endBuildingsRaisedTipLine(3));
    expect(endBuildingsRaisedTipLine(3)).toBe(t('end.raisedTip', { n: 3 }));
    expect(endBuildingsRaisedTipLine(3)).toBe('Levantados · 3');
    expect(endBuildingsRaisedTipLine(3)).toMatch(/^Levantados \u00b7 /);
    expect(es).not.toBe(endUnitsLostTipLine(3));
    expect(endUnitsLostTipLine(3)).toBe(t('end.lostTip', { n: 3 }));
    expect(endUnitsLostTipLine(3)).toBe('Perdidos · 3');
    expect(endUnitsLostTipLine(3)).toMatch(/^Perdidos \u00b7 /);
    expect(es).not.toBe(endKillsTipLine(3));
    expect(endKillsTipLine(3)).toBe(t('end.killsTip', { n: 3 }));
    expect(endKillsTipLine(3)).toBe('Bajas · 3');
    expect(endKillsTipLine(3)).toMatch(/^Bajas \u00b7 /);
    expect(es).not.toBe(endBuildingsLostTipLine(3));
    expect(endBuildingsLostTipLine(3)).toBe(t('end.bldLostTip', { n: 3 }));
    expect(endBuildingsLostTipLine(3)).toBe('Arrasados · 3');
    expect(endBuildingsLostTipLine(3)).toMatch(/^Arrasados \u00b7 /);
    expect(es).not.toBe(t('end.gathered', { gold: 2, crystals: 1 }));
    setLocale('en-GB');
  });
});
