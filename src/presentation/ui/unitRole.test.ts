import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitArmorClassTipLabel } from './unitArmorClassTip';
import { unitNameTipLabel } from './unitNameTip';
import {
  sharedUnitRoleLabel,
  unitRole,
  unitRoleLabel,
} from './unitRole';
import { unitSpeciesTipLabel } from './unitSpeciesTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('unitRole', () => {
  it('classifies worker, combat, and hero from catalog flags', () => {
    expect(unitRole('scavenger')).toBe('worker');
    expect(unitRole('bonker')).toBe('combat');
    expect(unitRole('gruk')).toBe('hero');
  });

  it('labels Role · worker/combat/hero with middot, distinct from Armor · / Species · / Name ·', () => {
    const worker = unitRoleLabel('scavenger');
    expect(worker).toBe(t('sel.roleTip', { role: t('sel.role.worker') }));
    expect(worker).toBe('Role · Worker');
    expect(worker).toMatch(/^Role \u00b7 /);
    expect(worker).toContain(' \u00b7 ');
    expect(worker).not.toContain('  ·  ');

    const combat = unitRoleLabel('bonker');
    expect(combat).toBe(t('sel.roleTip', { role: t('sel.role.combat') }));
    expect(combat).toBe('Role · Combat');
    expect(combat).toMatch(/^Role \u00b7 /);
    expect(combat).toContain(' \u00b7 ');

    const hero = unitRoleLabel('gruk');
    expect(hero).toBe(t('sel.roleTip', { role: t('sel.role.hero') }));
    expect(hero).toBe('Role · Hero');
    expect(hero).toMatch(/^Role \u00b7 /);
    expect(hero).toContain(' \u00b7 ');

    // Distinct from Armor · class (same Worker/Hero suffix still differs).
    expect(worker).not.toBe(unitArmorClassTipLabel('scavenger'));
    expect(unitArmorClassTipLabel('scavenger')).toBe('Armor · Worker');
    expect(unitArmorClassTipLabel('scavenger')).toMatch(/^Armor \u00b7 /);
    expect(hero).not.toBe(unitArmorClassTipLabel('gruk'));
    expect(unitArmorClassTipLabel('gruk')).toBe('Armor · Hero');
    expect(unitArmorClassTipLabel('gruk')).toMatch(/^Armor \u00b7 /);
    expect(combat).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armor \u00b7 /);
    expect(worker).not.toMatch(/^Armor \u00b7 /);
    expect(combat).not.toMatch(/^Armor \u00b7 /);
    expect(hero).not.toMatch(/^Armor \u00b7 /);

    // Distinct from Species · / Name · identity tips.
    expect(combat).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toBe('Species · The Brutes');
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Species \u00b7 /);
    expect(combat).not.toBe(unitNameTipLabel('bonker'));
    expect(unitNameTipLabel('bonker')).toBe('Name · Bonker');
    expect(unitNameTipLabel('bonker')).toMatch(/^Name \u00b7 /);
    expect(worker).not.toMatch(/^Species \u00b7 /);
    expect(combat).not.toMatch(/^Species \u00b7 /);
    expect(hero).not.toMatch(/^Species \u00b7 /);
    expect(worker).not.toMatch(/^Name \u00b7 /);
    expect(combat).not.toMatch(/^Name \u00b7 /);
    expect(hero).not.toMatch(/^Name \u00b7 /);

    // Role · variants stay mutually distinct.
    expect(worker).not.toBe(combat);
    expect(worker).not.toBe(hero);
    expect(combat).not.toBe(hero);
  });

  it('localizes Role · middot for pt-BR and es; stays distinct from Armor · / Species · / Name ·', () => {
    setLocale('pt-BR');
    const ptWorker = unitRoleLabel('scavenger');
    expect(ptWorker).toBe(t('sel.roleTip', { role: t('sel.role.worker') }));
    expect(ptWorker).toBe('Papel · Trabalhador');
    expect(ptWorker).toMatch(/^Papel \u00b7 /);
    expect(ptWorker).toContain(' \u00b7 ');
    expect(ptWorker).not.toContain('  ·  ');
    const ptCombat = unitRoleLabel('bonker');
    expect(ptCombat).toBe('Papel · Combate');
    expect(ptCombat).toMatch(/^Papel \u00b7 /);
    const ptHero = unitRoleLabel('gruk');
    expect(ptHero).toBe('Papel · Herói');
    expect(ptHero).toMatch(/^Papel \u00b7 /);
    expect(ptWorker).not.toBe(unitArmorClassTipLabel('scavenger'));
    expect(unitArmorClassTipLabel('scavenger')).toBe('Armadura · Trabalhador');
    expect(unitArmorClassTipLabel('scavenger')).toMatch(/^Armadura \u00b7 /);
    expect(ptHero).not.toBe(unitArmorClassTipLabel('gruk'));
    expect(unitArmorClassTipLabel('gruk')).toBe('Armadura · Herói');
    expect(unitArmorClassTipLabel('gruk')).toMatch(/^Armadura \u00b7 /);
    expect(ptCombat).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Espécie \u00b7 /);
    expect(ptCombat).not.toBe(unitNameTipLabel('bonker'));
    expect(unitNameTipLabel('bonker')).toMatch(/^Nome \u00b7 /);
    expect(ptWorker).not.toMatch(/^Armadura \u00b7 /);
    expect(ptCombat).not.toMatch(/^Espécie \u00b7 /);
    expect(ptCombat).not.toMatch(/^Nome \u00b7 /);

    setLocale('es');
    const esWorker = unitRoleLabel('scavenger');
    expect(esWorker).toBe(t('sel.roleTip', { role: t('sel.role.worker') }));
    expect(esWorker).toBe('Rol · Trabajador');
    expect(esWorker).toMatch(/^Rol \u00b7 /);
    expect(esWorker).toContain(' \u00b7 ');
    expect(esWorker).not.toContain('  ·  ');
    const esCombat = unitRoleLabel('bonker');
    expect(esCombat).toBe('Rol · Combate');
    expect(esCombat).toMatch(/^Rol \u00b7 /);
    const esHero = unitRoleLabel('gruk');
    expect(esHero).toBe('Rol · Héroe');
    expect(esHero).toMatch(/^Rol \u00b7 /);
    expect(esWorker).not.toBe(unitArmorClassTipLabel('scavenger'));
    expect(unitArmorClassTipLabel('scavenger')).toBe('Armadura · Trabajador');
    expect(unitArmorClassTipLabel('scavenger')).toMatch(/^Armadura \u00b7 /);
    expect(esHero).not.toBe(unitArmorClassTipLabel('gruk'));
    expect(unitArmorClassTipLabel('gruk')).toBe('Armadura · Héroe');
    expect(unitArmorClassTipLabel('gruk')).toMatch(/^Armadura \u00b7 /);
    expect(esCombat).not.toBe(unitSpeciesTipLabel('brutes'));
    expect(unitSpeciesTipLabel('brutes')).toMatch(/^Especie \u00b7 /);
    expect(esCombat).not.toBe(unitNameTipLabel('bonker'));
    expect(unitNameTipLabel('bonker')).toMatch(/^Nombre \u00b7 /);
    expect(esWorker).not.toMatch(/^Armadura \u00b7 /);
    expect(esCombat).not.toMatch(/^Especie \u00b7 /);
    expect(esCombat).not.toMatch(/^Nombre \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a label only when every selected type has the same role', () => {
    expect(sharedUnitRoleLabel(['bonker', 'rock_thrower'])).toBe(
      t('sel.roleTip', { role: t('sel.role.combat') }),
    );
    expect(sharedUnitRoleLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitRoleLabel([])).toBeNull();
  });
});
