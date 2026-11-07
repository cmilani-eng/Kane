import { beforeEach, describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import {
  buildingDisplayName,
  resetLocaleForTests,
  setLocale,
  t,
  unitDisplayName,
} from '../../i18n';
import { sharedUnitNameTipLabel, unitNameTipLabel } from './unitNameTip';

beforeEach(() => {
  resetLocaleForTests();
});

describe('unitNameTip', () => {
  it('labels the catalog unit name for a selection', () => {
    expect(unitNameTipLabel('bonker')).toBe(
      t('sel.nameTip', { name: getUnitType('bonker').name }),
    );
    expect(unitNameTipLabel('scavenger')).toContain(
      getUnitType('scavenger').name,
    );
  });

  it('shares a tip only when every selected unit is the same type', () => {
    expect(sharedUnitNameTipLabel(['bonker', 'bonker'])).toBe(
      t('sel.nameTip', { name: getUnitType('bonker').name }),
    );
    expect(sharedUnitNameTipLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitNameTipLabel([])).toBeNull();
  });

  it('translates unit and building names and keeps hero names', () => {
    setLocale('es');
    expect(unitDisplayName('bonker')).toBe('Golpeador');
    expect(unitDisplayName('gruk')).toBe('GRUK');
    expect(unitDisplayName('boniface')).toBe('KING BONIFACE');
    expect(unitDisplayName('zoggle')).toBe('ZOGGLE');
    expect(buildingDisplayName('barracks')).toBe('Cuartel');
    expect(buildingDisplayName('junkyard')).toBe('Desguace');
    expect(unitNameTipLabel('bonker')).toContain('Golpeador');
    expect(unitNameTipLabel('bonker')).not.toContain('Bonker');
    setLocale('pt-BR');
    expect(unitDisplayName('scavenger')).toBe('Catador');
    expect(buildingDisplayName('barracks')).toBe('Quartel');
  });
});
