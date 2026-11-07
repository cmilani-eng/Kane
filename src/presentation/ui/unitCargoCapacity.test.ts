import { describe, expect, it } from 'vitest';
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';
import { setLocale, t } from '../../i18n';
import {
  sharedUnitCargoCapacityLabel,
  unitCargoCapacity,
  unitCargoCapacityLabel,
} from './unitCargoCapacity';
import { unitCurrentCargoLabel } from './unitCurrentCargo';
import { unitGatherYieldLabel } from './unitGatherYield';

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

describe('unitCargoCapacity', () => {
  it('labels Cargo · n max with middot, distinct from Yield · / Cargo · now / carry line', () => {
    expect(unitCargoCapacity('scavenger')).toBe(10);
    const line = unitCargoCapacityLabel('scavenger')!;
    expect(line).toBe(t('sel.cargoCapTip', { n: 10 }));
    expect(line).toBe('Cargo · 10 max');
    expect(line).toMatch(/^Cargo \u00b7 /);
    expect(line).toMatch(/ max$/);
    expect(line).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(unitGatherYieldLabel('scavenger')).toBe('Yield · 10 per trip');
    expect(unitGatherYieldLabel('scavenger')).toMatch(/^Yield \u00b7 /);
    expect(line).not.toBe(unitCurrentCargoLabel([stubWorker(0)]));
    expect(unitCurrentCargoLabel([stubWorker(0)])).toBe('Cargo · empty');
    expect(unitCurrentCargoLabel([stubWorker(0)])).toMatch(/^Cargo \u00b7 /);
    expect(line).not.toBe(unitCurrentCargoLabel([stubWorker(8, 10)]));
    expect(unitCurrentCargoLabel([stubWorker(8, 10)])).toBe('Cargo · 8/10');
    expect(line).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'gold' }));
    expect(line).not.toMatch(/^Yield \u00b7 /);
    expect(line).not.toMatch(/ empty$/);
    expect(line).not.toMatch(/\d+\/\d+$/);

    expect(unitCargoCapacity('bonker')).toBeNull();
    expect(unitCargoCapacityLabel('bonker')).toBeNull();
  });

  it('localizes Cargo · n max middot for pt-BR and es; stays distinct from Yield / Cargo now / carry line', () => {
    setLocale('pt-BR');
    const pt = unitCargoCapacityLabel('scavenger')!;
    expect(pt).toBe(t('sel.cargoCapTip', { n: 10 }));
    expect(pt).toBe('Carga · 10 máx');
    expect(pt).toMatch(/^Carga \u00b7 /);
    expect(pt).toMatch(/ máx$/);
    expect(pt).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(unitGatherYieldLabel('scavenger')).toBe('Rendimento · 10 por viagem');
    expect(unitGatherYieldLabel('scavenger')).toMatch(/^Rendimento \u00b7 /);
    expect(pt).not.toBe(unitCurrentCargoLabel([stubWorker(0)]));
    expect(unitCurrentCargoLabel([stubWorker(0)])).toBe('Carga · vazia');
    expect(pt).not.toBe(unitCurrentCargoLabel([stubWorker(8, 10)]));
    expect(unitCurrentCargoLabel([stubWorker(8, 10)])).toBe('Carga · 8/10');
    expect(pt).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'ouro' }));
    expect(pt).not.toMatch(/^Rendimento \u00b7 /);
    expect(pt).not.toMatch(/ vazia$/);
    expect(pt).not.toMatch(/\d+\/\d+$/);

    setLocale('es');
    const es = unitCargoCapacityLabel('scavenger')!;
    expect(es).toBe(t('sel.cargoCapTip', { n: 10 }));
    expect(es).toBe('Carga · 10 máx');
    expect(es).toMatch(/^Carga \u00b7 /);
    expect(es).toMatch(/ máx$/);
    expect(es).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(unitGatherYieldLabel('scavenger')).toBe('Rendimiento · 10 por viaje');
    expect(unitGatherYieldLabel('scavenger')).toMatch(/^Rendimiento \u00b7 /);
    expect(es).not.toBe(unitCurrentCargoLabel([stubWorker(0)]));
    expect(unitCurrentCargoLabel([stubWorker(0)])).toBe('Carga · vacía');
    expect(es).not.toBe(unitCurrentCargoLabel([stubWorker(8, 10)]));
    expect(unitCurrentCargoLabel([stubWorker(8, 10)])).toBe('Carga · 8/10');
    expect(es).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'oro' }));
    expect(es).not.toMatch(/^Rendimiento \u00b7 /);
    expect(es).not.toMatch(/ vacía$/);
    expect(es).not.toMatch(/\d+\/\d+$/);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit matches capacity', () => {
    expect(sharedUnitCargoCapacityLabel(['scavenger', 'scavenger'])).toBe(
      unitCargoCapacityLabel('scavenger'),
    );
    expect(sharedUnitCargoCapacityLabel(['scavenger', 'bonker'])).toBeNull();
    expect(sharedUnitCargoCapacityLabel([])).toBeNull();
  });
});
