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

describe('endUnitsTrainedTipLine', () => {
  it('labels Trained · n with middot, distinct from Raised · / Lost · / Kills · / Razed · / Gathered ·', () => {
    expect(endUnitsTrainedTipLine(12)).toBe(t('end.trainedTip', { n: 12 }));
    expect(endUnitsTrainedTipLine(12)).toBe('Trained · 12');
    expect(endUnitsTrainedTipLine(12)).toMatch(/^Trained \u00b7 /);
    expect(endUnitsTrainedTipLine(12)).toContain(' \u00b7 ');
    expect(endUnitsTrainedTipLine(0)).toBe(t('end.trainedTip', { n: 0 }));
    expect(endUnitsTrainedTipLine(0)).toBe('Trained · 0');
    expect(endUnitsTrainedTipLine(0)).toMatch(/^Trained \u00b7 /);
    expect(endUnitsTrainedTipLine(-3)).toBe('Trained · 0');
    expect(endUnitsTrainedTipLine(2.9)).toBe('Trained · 2');

    const line = endUnitsTrainedTipLine(12);
    // Distinct from Raised · (buildings constructed vs units trained).
    expect(line).not.toBe(endBuildingsRaisedTipLine(12));
    expect(endBuildingsRaisedTipLine(12)).toBe(t('end.raisedTip', { n: 12 }));
    expect(endBuildingsRaisedTipLine(12)).toBe('Raised · 12');
    expect(endBuildingsRaisedTipLine(12)).toMatch(/^Raised \u00b7 /);
    // Distinct from combat count peers (Lost · / Kills · / Razed ·).
    expect(line).not.toBe(endUnitsLostTipLine(12));
    expect(endUnitsLostTipLine(12)).toBe(t('end.lostTip', { n: 12 }));
    expect(endUnitsLostTipLine(12)).toBe('Lost · 12');
    expect(endUnitsLostTipLine(12)).toMatch(/^Lost \u00b7 /);
    expect(line).not.toBe(endKillsTipLine(12));
    expect(endKillsTipLine(12)).toBe(t('end.killsTip', { n: 12 }));
    expect(endKillsTipLine(12)).toBe('Kills · 12');
    expect(endKillsTipLine(12)).toMatch(/^Kills \u00b7 /);
    expect(line).not.toBe(endBuildingsLostTipLine(12));
    expect(endBuildingsLostTipLine(12)).toBe(t('end.bldLostTip', { n: 12 }));
    expect(endBuildingsLostTipLine(12)).toBe('Razed · 12');
    expect(endBuildingsLostTipLine(12)).toMatch(/^Razed \u00b7 /);
    // Distinct from Gathered · (economy total vs production count).
    expect(line).not.toBe(endResourcesGatheredTipLine(10, 2));
    expect(endResourcesGatheredTipLine(10, 2)).toBe(
      t('end.gatheredTip', { n: 12 }),
    );
    expect(endResourcesGatheredTipLine(10, 2)).toBe('Gathered · 12');
    expect(endResourcesGatheredTipLine(10, 2)).toMatch(/^Gathered \u00b7 /);
    expect(line).not.toMatch(/^Raised \u00b7 /);
    expect(line).not.toMatch(/^Lost \u00b7 /);
    expect(line).not.toMatch(/^Kills \u00b7 /);
    expect(line).not.toMatch(/^Razed \u00b7 /);
    expect(line).not.toMatch(/^Gathered \u00b7 /);
  });

  it('localizes Trained · n middot for pt-BR and es; stays distinct from Raised / Lost / Kills / Razed / Gathered', () => {
    setLocale('pt-BR');
    const pt = endUnitsTrainedTipLine(12);
    expect(pt).toBe(t('end.trainedTip', { n: 12 }));
    expect(pt).toBe('Treinados · 12');
    expect(pt).toMatch(/^Treinados \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(endBuildingsRaisedTipLine(12));
    expect(endBuildingsRaisedTipLine(12)).toBe(t('end.raisedTip', { n: 12 }));
    expect(endBuildingsRaisedTipLine(12)).toBe('Erguidos · 12');
    expect(endBuildingsRaisedTipLine(12)).toMatch(/^Erguidos \u00b7 /);
    expect(pt).not.toBe(endUnitsLostTipLine(12));
    expect(endUnitsLostTipLine(12)).toBe(t('end.lostTip', { n: 12 }));
    expect(endUnitsLostTipLine(12)).toBe('Perdidos · 12');
    expect(endUnitsLostTipLine(12)).toMatch(/^Perdidos \u00b7 /);
    expect(pt).not.toBe(endKillsTipLine(12));
    expect(endKillsTipLine(12)).toBe(t('end.killsTip', { n: 12 }));
    expect(endKillsTipLine(12)).toBe('Abates · 12');
    expect(endKillsTipLine(12)).toMatch(/^Abates \u00b7 /);
    expect(pt).not.toBe(endBuildingsLostTipLine(12));
    expect(endBuildingsLostTipLine(12)).toBe(t('end.bldLostTip', { n: 12 }));
    expect(endBuildingsLostTipLine(12)).toBe('Derrubados · 12');
    expect(endBuildingsLostTipLine(12)).toMatch(/^Derrubados \u00b7 /);
    expect(pt).not.toBe(endResourcesGatheredTipLine(10, 2));
    expect(endResourcesGatheredTipLine(10, 2)).toBe(
      t('end.gatheredTip', { n: 12 }),
    );
    expect(endResourcesGatheredTipLine(10, 2)).toBe('Coletado · 12');
    expect(endResourcesGatheredTipLine(10, 2)).toMatch(/^Coletado \u00b7 /);

    setLocale('es');
    const es = endUnitsTrainedTipLine(12);
    expect(es).toBe(t('end.trainedTip', { n: 12 }));
    expect(es).toBe('Entrenados · 12');
    expect(es).toMatch(/^Entrenados \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(endBuildingsRaisedTipLine(12));
    expect(endBuildingsRaisedTipLine(12)).toBe(t('end.raisedTip', { n: 12 }));
    expect(endBuildingsRaisedTipLine(12)).toBe('Levantados · 12');
    expect(endBuildingsRaisedTipLine(12)).toMatch(/^Levantados \u00b7 /);
    expect(es).not.toBe(endUnitsLostTipLine(12));
    expect(endUnitsLostTipLine(12)).toBe(t('end.lostTip', { n: 12 }));
    expect(endUnitsLostTipLine(12)).toBe('Perdidos · 12');
    expect(endUnitsLostTipLine(12)).toMatch(/^Perdidos \u00b7 /);
    expect(es).not.toBe(endKillsTipLine(12));
    expect(endKillsTipLine(12)).toBe(t('end.killsTip', { n: 12 }));
    expect(endKillsTipLine(12)).toBe('Bajas · 12');
    expect(endKillsTipLine(12)).toMatch(/^Bajas \u00b7 /);
    expect(es).not.toBe(endBuildingsLostTipLine(12));
    expect(endBuildingsLostTipLine(12)).toBe(t('end.bldLostTip', { n: 12 }));
    expect(endBuildingsLostTipLine(12)).toBe('Arrasados · 12');
    expect(endBuildingsLostTipLine(12)).toMatch(/^Arrasados \u00b7 /);
    expect(es).not.toBe(endResourcesGatheredTipLine(10, 2));
    expect(endResourcesGatheredTipLine(10, 2)).toBe(
      t('end.gatheredTip', { n: 12 }),
    );
    expect(endResourcesGatheredTipLine(10, 2)).toBe('Recogido · 12');
    expect(endResourcesGatheredTipLine(10, 2)).toMatch(/^Recogido \u00b7 /);
    setLocale('en-GB');
  });
});
