import { describe, expect, it } from 'vitest';
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';
import { setLocale, t } from '../../i18n';
import { unitCargoCapacityLabel } from './unitCargoCapacity';
import { unitCurrentCargoLabel } from './unitCurrentCargo';
import {
  sharedUnitGatherYieldLabel,
  unitGatherYield,
  unitGatherYieldLabel,
} from './unitGatherYield';

function stubWorker(
  carrying: number,
  carryCapacity = 10,
): BattlefieldUnit {
  return {
    hp: 10,
    carrying,
    carryCapacity,
    canGather: true,
  } as BattlefieldUnit;
}

describe('unitGatherYield', () => {
  it('labels Yield · n per trip with middot, distinct from Cargo · max / Cargo · now / carry line', () => {
    expect(unitGatherYield('scavenger')).toBe(10);
    const line = unitGatherYieldLabel('scavenger')!;
    expect(line).toBe(t('sel.yieldTip', { n: 10 }));
    expect(line).toBe('Yield · 10 per trip');
    expect(line).toMatch(/^Yield \u00b7 /);
    expect(line).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(unitCargoCapacityLabel('scavenger')).toBe('Cargo · 10 max');
    expect(unitCargoCapacityLabel('scavenger')).toMatch(/^Cargo \u00b7 /);
    expect(line).not.toBe(unitCurrentCargoLabel([stubWorker(0)]));
    expect(unitCurrentCargoLabel([stubWorker(0)])).toBe('Cargo · empty');
    expect(unitCurrentCargoLabel([stubWorker(0)])).toMatch(/^Cargo \u00b7 /);
    expect(line).not.toBe(unitCurrentCargoLabel([stubWorker(8, 10)]));
    expect(unitCurrentCargoLabel([stubWorker(8, 10)])).toBe('Cargo · 8/10');
    expect(line).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'gold' }));
    expect(line).not.toMatch(/^Cargo \u00b7 /);
    expect(line).not.toMatch(/^Carga \u00b7 /);

    expect(unitGatherYield('bonker')).toBeNull();
    expect(unitGatherYieldLabel('bonker')).toBeNull();
  });

  it('localizes Yield middot for pt-BR and es; stays distinct from Cargo max / Cargo now / carry line', () => {
    setLocale('pt-BR');
    const pt = unitGatherYieldLabel('scavenger')!;
    expect(pt).toBe(t('sel.yieldTip', { n: 10 }));
    expect(pt).toBe('Rendimento · 10 por viagem');
    expect(pt).toMatch(/^Rendimento \u00b7 /);
    expect(pt).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(unitCargoCapacityLabel('scavenger')).toBe('Carga · 10 máx');
    expect(unitCargoCapacityLabel('scavenger')).toMatch(/^Carga \u00b7 /);
    expect(pt).not.toBe(unitCurrentCargoLabel([stubWorker(0)]));
    expect(unitCurrentCargoLabel([stubWorker(0)])).toBe('Carga · vazia');
    expect(pt).not.toBe(unitCurrentCargoLabel([stubWorker(8, 10)]));
    expect(unitCurrentCargoLabel([stubWorker(8, 10)])).toBe('Carga · 8/10');
    expect(pt).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'ouro' }));
    expect(pt).not.toMatch(/^Carga \u00b7 /);

    setLocale('es');
    const es = unitGatherYieldLabel('scavenger')!;
    expect(es).toBe(t('sel.yieldTip', { n: 10 }));
    expect(es).toBe('Rendimiento · 10 por viaje');
    expect(es).toMatch(/^Rendimiento \u00b7 /);
    expect(es).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(unitCargoCapacityLabel('scavenger')).toBe('Carga · 10 máx');
    expect(unitCargoCapacityLabel('scavenger')).toMatch(/^Carga \u00b7 /);
    expect(es).not.toBe(unitCurrentCargoLabel([stubWorker(0)]));
    expect(unitCurrentCargoLabel([stubWorker(0)])).toBe('Carga · vacía');
    expect(es).not.toBe(unitCurrentCargoLabel([stubWorker(8, 10)]));
    expect(unitCurrentCargoLabel([stubWorker(8, 10)])).toBe('Carga · 8/10');
    expect(es).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'oro' }));
    expect(es).not.toMatch(/^Carga \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit matches yield', () => {
    expect(sharedUnitGatherYieldLabel(['scavenger', 'scavenger'])).toBe(
      unitGatherYieldLabel('scavenger'),
    );
    expect(sharedUnitGatherYieldLabel(['scavenger', 'bonker'])).toBeNull();
    expect(sharedUnitGatherYieldLabel([])).toBeNull();
  });
});
