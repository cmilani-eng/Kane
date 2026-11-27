import { beforeEach, describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { buildingBuildTimeLabel } from './buildingBuildTime';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import { unitTrainCrystalLabel } from './unitTrainCrystal';
import {
  sharedUnitTrainDurationLabel,
  unitTrainDurationLabel,
  unitTrainDurationSec,
} from './unitTrainDuration';
import { unitTrainGoldLabel } from './unitTrainGold';

beforeEach(() => {
  setLocale('en-GB');
});

describe('unitTrainDuration', () => {
  it('ceils catalog trainMs to whole seconds', () => {
    const ms = getUnitType('bonker').trainMs;
    expect(ms).toBeGreaterThan(0);
    expect(unitTrainDurationSec('bonker')).toBe(Math.ceil(ms / 1000));
  });

  it('labels Train · {n}s with middot, distinct from Gold · / Crystal · / Atk CD · / Build · / trainSec', () => {
    const n = unitTrainDurationSec('bonker')!;
    const line = unitTrainDurationLabel('bonker')!;
    expect(line).toBe(t('sel.trainDurationTip', { n }));
    expect(line).toBe(`Train · ${n}s`);
    expect(line).toMatch(/^Train \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    expect(line).not.toContain('  ·  ');
    expect(line).toMatch(/\d+s$/);

    // Distinct from train cost peers (Gold · / Crystal ·).
    expect(line).not.toBe(unitTrainGoldLabel('bonker'));
    expect(unitTrainGoldLabel('bonker')).toMatch(/^Gold \u00b7 /);
    expect(line).not.toMatch(/^Gold \u00b7 /);
    const crystal = unitTrainCrystalLabel('bonker');
    if (crystal != null) {
      expect(line).not.toBe(crystal);
      expect(crystal).toMatch(/^Crystal \u00b7 /);
    }
    expect(line).not.toMatch(/^Crystal \u00b7 /);

    // Distinct from Atk CD · Ns (combat interval vs train duration).
    expect(line).not.toBe(unitAttackCooldownLabel('bonker'));
    expect(unitAttackCooldownLabel('bonker')).toMatch(/^Atk CD \u00b7 /);
    expect(line).not.toMatch(/^Atk CD \u00b7 /);

    // Distinct from building Build · {n}s catalog twin.
    expect(line).not.toBe(buildingBuildTimeLabel('bonker_hut'));
    expect(buildingBuildTimeLabel('bonker_hut')).toMatch(/^Build \u00b7 /);
    expect(line).not.toMatch(/^Build \u00b7 /);

    // Distinct from train browse button seconds chip (no Train · label).
    expect(line).not.toBe(t('sel.trainSec', { sec: n }));
    expect(t('sel.trainSec', { sec: n })).toBe(`${n}s`);
  });

  it('localizes Train · {n}s middot for pt-BR and es; stays distinct from Gold · / Crystal · / Atk CD · / Build · / trainSec', () => {
    const n = unitTrainDurationSec('bonker')!;

    setLocale('pt-BR');
    const pt = unitTrainDurationLabel('bonker')!;
    expect(pt).toBe(t('sel.trainDurationTip', { n }));
    expect(pt).toBe(`Treino · ${n}s`);
    expect(pt).toMatch(/^Treino \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toContain('  ·  ');
    expect(pt).not.toBe(unitTrainGoldLabel('bonker'));
    expect(unitTrainGoldLabel('bonker')).toMatch(/^Ouro \u00b7 /);
    expect(pt).not.toMatch(/^Ouro \u00b7 /);
    expect(pt).not.toMatch(/^Cristal \u00b7 /);
    expect(pt).not.toBe(unitAttackCooldownLabel('bonker'));
    expect(unitAttackCooldownLabel('bonker')).toMatch(/^CD atq\. \u00b7 /);
    expect(pt).not.toMatch(/^CD atq\. \u00b7 /);
    expect(pt).not.toBe(buildingBuildTimeLabel('bonker_hut'));
    expect(buildingBuildTimeLabel('bonker_hut')).toMatch(/^Construção \u00b7 /);
    expect(pt).not.toMatch(/^Construção \u00b7 /);
    expect(pt).not.toBe(t('sel.trainSec', { sec: n }));
    expect(t('sel.trainSec', { sec: n })).toBe(`${n}s`);

    setLocale('es');
    const es = unitTrainDurationLabel('bonker')!;
    expect(es).toBe(t('sel.trainDurationTip', { n }));
    expect(es).toBe(`Entreno · ${n}s`);
    expect(es).toMatch(/^Entreno \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toContain('  ·  ');
    expect(es).not.toBe(unitTrainGoldLabel('bonker'));
    expect(unitTrainGoldLabel('bonker')).toMatch(/^Oro \u00b7 /);
    expect(es).not.toMatch(/^Oro \u00b7 /);
    expect(es).not.toMatch(/^Cristal \u00b7 /);
    expect(es).not.toBe(unitAttackCooldownLabel('bonker'));
    expect(unitAttackCooldownLabel('bonker')).toMatch(/^CD atq\. \u00b7 /);
    expect(es).not.toMatch(/^CD atq\. \u00b7 /);
    expect(es).not.toBe(buildingBuildTimeLabel('bonker_hut'));
    expect(buildingBuildTimeLabel('bonker_hut')).toMatch(/^Construcción \u00b7 /);
    expect(es).not.toMatch(/^Construcción \u00b7 /);
    expect(es).not.toBe(t('sel.trainSec', { sec: n }));
    expect(t('sel.trainSec', { sec: n })).toBe(`${n}s`);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit is the same type', () => {
    const tip = unitTrainDurationLabel('bonker');
    expect(sharedUnitTrainDurationLabel(['bonker', 'bonker'])).toBe(tip);
    expect(sharedUnitTrainDurationLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitTrainDurationLabel([])).toBeNull();
  });
});
