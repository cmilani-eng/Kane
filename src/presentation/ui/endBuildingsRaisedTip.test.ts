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

describe('endBuildingsRaisedTipLine', () => {
  it('labels Raised · n with middot, distinct from Trained · / Lost · / Kills · / Razed · / Gathered ·', () => {
    expect(endBuildingsRaisedTipLine(3)).toBe(t('end.raisedTip', { n: 3 }));
    expect(endBuildingsRaisedTipLine(3)).toBe('Raised · 3');
    expect(endBuildingsRaisedTipLine(3)).toMatch(/^Raised \u00b7 /);
    expect(endBuildingsRaisedTipLine(3)).toContain(' \u00b7 ');
    expect(endBuildingsRaisedTipLine(0)).toBe(t('end.raisedTip', { n: 0 }));
    expect(endBuildingsRaisedTipLine(0)).toBe('Raised · 0');
    expect(endBuildingsRaisedTipLine(0)).toMatch(/^Raised \u00b7 /);
    expect(endBuildingsRaisedTipLine(-3)).toBe('Raised · 0');
    expect(endBuildingsRaisedTipLine(2.9)).toBe('Raised · 2');

    const line = endBuildingsRaisedTipLine(3);
    // Distinct from Trained · (units trained vs buildings constructed).
    expect(line).not.toBe(endUnitsTrainedTipLine(3));
    expect(endUnitsTrainedTipLine(3)).toBe(t('end.trainedTip', { n: 3 }));
    expect(endUnitsTrainedTipLine(3)).toBe('Trained · 3');
    expect(endUnitsTrainedTipLine(3)).toMatch(/^Trained \u00b7 /);
    // Distinct from combat count peers (Lost · / Kills · / Razed ·).
    expect(line).not.toBe(endUnitsLostTipLine(3));
    expect(endUnitsLostTipLine(3)).toBe(t('end.lostTip', { n: 3 }));
    expect(endUnitsLostTipLine(3)).toBe('Lost · 3');
    expect(endUnitsLostTipLine(3)).toMatch(/^Lost \u00b7 /);
    expect(line).not.toBe(endKillsTipLine(3));
    expect(endKillsTipLine(3)).toBe(t('end.killsTip', { n: 3 }));
    expect(endKillsTipLine(3)).toBe('Kills · 3');
    expect(endKillsTipLine(3)).toMatch(/^Kills \u00b7 /);
    // Distinct from Razed · (buildings constructed vs destroyed; near-homophone).
    expect(line).not.toBe(endBuildingsLostTipLine(3));
    expect(endBuildingsLostTipLine(3)).toBe(t('end.bldLostTip', { n: 3 }));
    expect(endBuildingsLostTipLine(3)).toBe('Razed · 3');
    expect(endBuildingsLostTipLine(3)).toMatch(/^Razed \u00b7 /);
    // Distinct from Gathered · (economy total vs construction count).
    expect(line).not.toBe(endResourcesGatheredTipLine(2, 1));
    expect(endResourcesGatheredTipLine(2, 1)).toBe(
      t('end.gatheredTip', { n: 3 }),
    );
    expect(endResourcesGatheredTipLine(2, 1)).toBe('Gathered · 3');
    expect(endResourcesGatheredTipLine(2, 1)).toMatch(/^Gathered \u00b7 /);
    expect(line).not.toMatch(/^Trained \u00b7 /);
    expect(line).not.toMatch(/^Lost \u00b7 /);
    expect(line).not.toMatch(/^Kills \u00b7 /);
    expect(line).not.toMatch(/^Razed \u00b7 /);
    expect(line).not.toMatch(/^Gathered \u00b7 /);
  });

  it('localizes Raised · n middot for pt-BR and es; stays distinct from Trained / Lost / Kills / Razed / Gathered', () => {
    setLocale('pt-BR');
    const pt = endBuildingsRaisedTipLine(3);
    expect(pt).toBe(t('end.raisedTip', { n: 3 }));
    expect(pt).toBe('Erguidos · 3');
    expect(pt).toMatch(/^Erguidos \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(endUnitsTrainedTipLine(3));
    expect(endUnitsTrainedTipLine(3)).toBe(t('end.trainedTip', { n: 3 }));
    expect(endUnitsTrainedTipLine(3)).toBe('Treinados · 3');
    expect(endUnitsTrainedTipLine(3)).toMatch(/^Treinados \u00b7 /);
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
    expect(pt).not.toBe(endResourcesGatheredTipLine(2, 1));
    expect(endResourcesGatheredTipLine(2, 1)).toBe(
      t('end.gatheredTip', { n: 3 }),
    );
    expect(endResourcesGatheredTipLine(2, 1)).toBe('Coletado · 3');
    expect(endResourcesGatheredTipLine(2, 1)).toMatch(/^Coletado \u00b7 /);

    setLocale('es');
    const es = endBuildingsRaisedTipLine(3);
    expect(es).toBe(t('end.raisedTip', { n: 3 }));
    expect(es).toBe('Levantados · 3');
    expect(es).toMatch(/^Levantados \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(endUnitsTrainedTipLine(3));
    expect(endUnitsTrainedTipLine(3)).toBe(t('end.trainedTip', { n: 3 }));
    expect(endUnitsTrainedTipLine(3)).toBe('Entrenados · 3');
    expect(endUnitsTrainedTipLine(3)).toMatch(/^Entrenados \u00b7 /);
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
    expect(es).not.toBe(endResourcesGatheredTipLine(2, 1));
    expect(endResourcesGatheredTipLine(2, 1)).toBe(
      t('end.gatheredTip', { n: 3 }),
    );
    expect(endResourcesGatheredTipLine(2, 1)).toBe('Recogido · 3');
    expect(endResourcesGatheredTipLine(2, 1)).toMatch(/^Recogido \u00b7 /);
    setLocale('en-GB');
  });
});
