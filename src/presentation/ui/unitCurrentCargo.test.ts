import { describe, expect, it } from 'vitest';
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';
import { setLocale, t } from '../../i18n';
import { unitCargoCapacityLabel } from './unitCargoCapacity';
import { unitCurrentCargoLabel } from './unitCurrentCargo';
import { unitGatherYieldLabel } from './unitGatherYield';

function stub(
  carrying: number,
  carryCapacity = 10,
  canGather = true,
  hp = 10,
): BattlefieldUnit {
  return { hp, carrying, carryCapacity, canGather } as BattlefieldUnit;
}

describe('unitCurrentCargo', () => {
  it('returns null for non-workers', () => {
    expect(unitCurrentCargoLabel([stub(0, 0, false)])).toBeNull();
    expect(unitCurrentCargoLabel([])).toBeNull();
  });

  it('labels Cargo · empty / Cargo · n/cap with middot, distinct from Yield · / Cargo · max / carry line', () => {
    const empty = unitCurrentCargoLabel([stub(0)])!;
    expect(empty).toBe(t('sel.cargoNowEmpty'));
    expect(empty).toBe('Cargo · empty');
    expect(empty).toMatch(/^Cargo \u00b7 /);
    expect(empty).toMatch(/ empty$/);

    const loaded = unitCurrentCargoLabel([stub(8, 10)])!;
    expect(loaded).toBe(t('sel.cargoNowTip', { n: 8, cap: 10 }));
    expect(loaded).toBe('Cargo · 8/10');
    expect(loaded).toMatch(/^Cargo \u00b7 /);
    expect(loaded).toMatch(/\d+\/\d+$/);

    expect(empty).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(unitGatherYieldLabel('scavenger')).toBe('Yield · 10 per trip');
    expect(unitGatherYieldLabel('scavenger')).toMatch(/^Yield \u00b7 /);
    expect(loaded).not.toBe(unitGatherYieldLabel('scavenger'));

    expect(empty).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(unitCargoCapacityLabel('scavenger')).toBe('Cargo · 10 max');
    expect(unitCargoCapacityLabel('scavenger')).toMatch(/^Cargo \u00b7 /);
    expect(loaded).not.toBe(unitCargoCapacityLabel('scavenger'));

    expect(empty).not.toBe(loaded);
    expect(empty).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'gold' }));
    expect(loaded).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'gold' }));
    expect(empty).not.toMatch(/^Yield \u00b7 /);
    expect(loaded).not.toMatch(/^Yield \u00b7 /);
    expect(empty).not.toMatch(/ max$/);
    expect(loaded).not.toMatch(/ max$/);
    expect(empty).not.toMatch(/\d+\/\d+$/);
    expect(loaded).not.toMatch(/ empty$/);
  });

  it('localizes Cargo · now middot for pt-BR and es; stays distinct from Yield / Cargo max / carry line', () => {
    setLocale('pt-BR');
    const ptEmpty = unitCurrentCargoLabel([stub(0)])!;
    expect(ptEmpty).toBe(t('sel.cargoNowEmpty'));
    expect(ptEmpty).toBe('Carga · vazia');
    expect(ptEmpty).toMatch(/^Carga \u00b7 /);
    expect(ptEmpty).toMatch(/ vazia$/);
    const ptLoaded = unitCurrentCargoLabel([stub(8, 10)])!;
    expect(ptLoaded).toBe(t('sel.cargoNowTip', { n: 8, cap: 10 }));
    expect(ptLoaded).toBe('Carga · 8/10');
    expect(ptLoaded).toMatch(/^Carga \u00b7 /);
    expect(ptLoaded).toMatch(/\d+\/\d+$/);
    expect(ptEmpty).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(unitGatherYieldLabel('scavenger')).toBe('Rendimento · 10 por viagem');
    expect(unitGatherYieldLabel('scavenger')).toMatch(/^Rendimento \u00b7 /);
    expect(ptLoaded).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(ptEmpty).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(unitCargoCapacityLabel('scavenger')).toBe('Carga · 10 máx');
    expect(unitCargoCapacityLabel('scavenger')).toMatch(/^Carga \u00b7 /);
    expect(ptLoaded).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(ptEmpty).not.toBe(ptLoaded);
    expect(ptEmpty).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'ouro' }));
    expect(ptLoaded).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'ouro' }));
    expect(ptEmpty).not.toMatch(/^Rendimento \u00b7 /);
    expect(ptLoaded).not.toMatch(/^Rendimento \u00b7 /);
    expect(ptEmpty).not.toMatch(/ máx$/);
    expect(ptLoaded).not.toMatch(/ máx$/);

    setLocale('es');
    const esEmpty = unitCurrentCargoLabel([stub(0)])!;
    expect(esEmpty).toBe(t('sel.cargoNowEmpty'));
    expect(esEmpty).toBe('Carga · vacía');
    expect(esEmpty).toMatch(/^Carga \u00b7 /);
    expect(esEmpty).toMatch(/ vacía$/);
    const esLoaded = unitCurrentCargoLabel([stub(8, 10)])!;
    expect(esLoaded).toBe(t('sel.cargoNowTip', { n: 8, cap: 10 }));
    expect(esLoaded).toBe('Carga · 8/10');
    expect(esLoaded).toMatch(/^Carga \u00b7 /);
    expect(esLoaded).toMatch(/\d+\/\d+$/);
    expect(esEmpty).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(unitGatherYieldLabel('scavenger')).toBe('Rendimiento · 10 por viaje');
    expect(unitGatherYieldLabel('scavenger')).toMatch(/^Rendimiento \u00b7 /);
    expect(esLoaded).not.toBe(unitGatherYieldLabel('scavenger'));
    expect(esEmpty).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(unitCargoCapacityLabel('scavenger')).toBe('Carga · 10 máx');
    expect(unitCargoCapacityLabel('scavenger')).toMatch(/^Carga \u00b7 /);
    expect(esLoaded).not.toBe(unitCargoCapacityLabel('scavenger'));
    expect(esEmpty).not.toBe(esLoaded);
    expect(esEmpty).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'oro' }));
    expect(esLoaded).not.toBe(t('sel.cargo', { n: 8, cap: 10, resource: 'oro' }));
    expect(esEmpty).not.toMatch(/^Rendimiento \u00b7 /);
    expect(esLoaded).not.toMatch(/^Rendimiento \u00b7 /);
    expect(esEmpty).not.toMatch(/ máx$/);
    expect(esLoaded).not.toMatch(/ máx$/);
    setLocale('en-GB');
  });

  it('sums group cargo and capacity', () => {
    expect(unitCurrentCargoLabel([stub(4, 10), stub(6, 10)])).toBe(
      t('sel.cargoNowTip', { n: 10, cap: 20 }),
    );
    expect(unitCurrentCargoLabel([stub(4, 10), stub(6, 10)])).toBe(
      'Cargo · 10/20',
    );
    expect(unitCurrentCargoLabel([stub(4, 10), stub(6, 10)])).toMatch(
      /^Cargo \u00b7 /,
    );
  });
});
