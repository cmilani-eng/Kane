import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildingDisplayName,
  setLocale,
  t,
  unitDisplayName,
} from '../../i18n';
import { unitArmorClassTipLabel } from './unitArmorClassTip';
import { sharedUnitNameTipLabel, unitNameTipLabel } from './unitNameTip';
import { unitRoleLabel } from './unitRole';
import { unitSpeciesTipLabel } from './unitSpeciesTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('unitNameTip', () => {
  it('labels Name · catalog name with middot, distinct from Species · / Role · / Armor ·', () => {
    const bonker = unitNameTipLabel('bonker');
    expect(bonker).toBe(
      t('sel.nameTip', { name: unitDisplayName('bonker') }),
    );
    expect(bonker).toBe('Name · Bonker');
    expect(bonker).toMatch(/^Name \u00b7 /);
    expect(bonker).toContain(' \u00b7 ');
    expect(bonker).not.toContain('  ·  ');

    const scavenger = unitNameTipLabel('scavenger');
    expect(scavenger).toBe(
      t('sel.nameTip', { name: unitDisplayName('scavenger') }),
    );
    expect(scavenger).toBe('Name · Scavenger');
    expect(scavenger).toMatch(/^Name \u00b7 /);
    expect(scavenger).toContain(' \u00b7 ');

    const gruk = unitNameTipLabel('gruk');
    expect(gruk).toBe(t('sel.nameTip', { name: unitDisplayName('gruk') }));
    expect(gruk).toBe('Name · GRUK');
    expect(gruk).toMatch(/^Name \u00b7 /);
    expect(gruk).toContain(' \u00b7 ');

    // Distinct from Species · / Role · / Armor · class identity tips.
    expect(bonker).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toBe('Species · The Brutes');
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Species \u00b7 /);
    expect(bonker).not.toBe(unitRoleLabel('bonker'));
    expect(unitRoleLabel('bonker')).toBe('Role · Combat');
    expect(unitRoleLabel('bonker')).toMatch(/^Role \u00b7 /);
    expect(bonker).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armor \u00b7 /);
    expect(bonker).not.toMatch(/^Species \u00b7 /);
    expect(bonker).not.toMatch(/^Role \u00b7 /);
    expect(bonker).not.toMatch(/^Armor \u00b7 /);
    expect(scavenger).not.toMatch(/^Species \u00b7 /);
    expect(gruk).not.toMatch(/^Role \u00b7 /);

    // Name · variants stay mutually distinct.
    expect(bonker).not.toBe(scavenger);
    expect(bonker).not.toBe(gruk);
    expect(scavenger).not.toBe(gruk);
  });

  it('localizes Name · middot for pt-BR and es; stays distinct from Species · / Role · / Armor ·', () => {
    setLocale('pt-BR');
    const ptBonker = unitNameTipLabel('bonker');
    expect(ptBonker).toBe(
      t('sel.nameTip', { name: unitDisplayName('bonker') }),
    );
    expect(ptBonker).toBe('Nome · Pancador');
    expect(ptBonker).toMatch(/^Nome \u00b7 /);
    expect(ptBonker).toContain(' \u00b7 ');
    expect(ptBonker).not.toContain('  ·  ');
    const ptScavenger = unitNameTipLabel('scavenger');
    expect(ptScavenger).toBe('Nome · Catador');
    expect(ptScavenger).toMatch(/^Nome \u00b7 /);
    const ptGruk = unitNameTipLabel('gruk');
    expect(ptGruk).toBe('Nome · GRUK');
    expect(ptGruk).toMatch(/^Nome \u00b7 /);
    expect(ptBonker).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Espécie \u00b7 /);
    expect(ptBonker).not.toBe(unitRoleLabel('bonker'));
    expect(unitRoleLabel('bonker')).toBe('Papel · Combate');
    expect(unitRoleLabel('bonker')).toMatch(/^Papel \u00b7 /);
    expect(ptBonker).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armadura \u00b7 /);
    expect(ptBonker).not.toMatch(/^Espécie \u00b7 /);
    expect(ptBonker).not.toMatch(/^Papel \u00b7 /);
    expect(ptBonker).not.toMatch(/^Armadura \u00b7 /);

    setLocale('es');
    const esBonker = unitNameTipLabel('bonker');
    expect(esBonker).toBe(
      t('sel.nameTip', { name: unitDisplayName('bonker') }),
    );
    expect(esBonker).toBe('Nombre · Golpeador');
    expect(esBonker).toMatch(/^Nombre \u00b7 /);
    expect(esBonker).toContain(' \u00b7 ');
    expect(esBonker).not.toContain('  ·  ');
    const esScavenger = unitNameTipLabel('scavenger');
    expect(esScavenger).toBe('Nombre · Carroñero');
    expect(esScavenger).toMatch(/^Nombre \u00b7 /);
    const esGruk = unitNameTipLabel('gruk');
    expect(esGruk).toBe('Nombre · GRUK');
    expect(esGruk).toMatch(/^Nombre \u00b7 /);
    expect(esBonker).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Especie \u00b7 /);
    expect(esBonker).not.toBe(unitRoleLabel('bonker'));
    expect(unitRoleLabel('bonker')).toBe('Rol · Combate');
    expect(unitRoleLabel('bonker')).toMatch(/^Rol \u00b7 /);
    expect(esBonker).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armadura \u00b7 /);
    expect(esBonker).not.toMatch(/^Especie \u00b7 /);
    expect(esBonker).not.toMatch(/^Rol \u00b7 /);
    expect(esBonker).not.toMatch(/^Armadura \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit is the same type', () => {
    expect(sharedUnitNameTipLabel(['bonker', 'bonker'])).toBe(
      t('sel.nameTip', { name: unitDisplayName('bonker') }),
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
    setLocale('en-GB');
  });
});
