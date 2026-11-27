import { beforeEach, describe, expect, it } from 'vitest';
import { speciesName, setLocale, t } from '../../i18n';
import { unitArmorClassTipLabel } from './unitArmorClassTip';
import { unitNameTipLabel } from './unitNameTip';
import { unitRoleLabel } from './unitRole';
import {
  sharedUnitSpeciesTipLabel,
  unitSpeciesTipLabel,
} from './unitSpeciesTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('unitSpeciesTip', () => {
  it('labels Species · name with middot, distinct from Role · / Name · / Armor ·', () => {
    const brutes = unitSpeciesTipLabel('brutes');
    expect(brutes).toBe(
      t('sel.speciesTip', { name: speciesName('brutes') }),
    );
    expect(brutes).toBe('Species · The Brutes');
    expect(brutes).toMatch(/^Species \u00b7 /);
    expect(brutes).toContain(' \u00b7 ');
    expect(brutes).not.toContain('  ·  ');

    const nobles = unitSpeciesTipLabel('nobles');
    expect(nobles).toBe(
      t('sel.speciesTip', { name: speciesName('nobles') }),
    );
    expect(nobles).toBe('Species · The Nobles');
    expect(nobles).toMatch(/^Species \u00b7 /);
    expect(nobles).toContain(' \u00b7 ');

    const weirdos = unitSpeciesTipLabel('weirdos');
    expect(weirdos).toBe(
      t('sel.speciesTip', { name: speciesName('weirdos') }),
    );
    expect(weirdos).toBe('Species · The Weirdos');
    expect(weirdos).toMatch(/^Species \u00b7 /);
    expect(weirdos).toContain(' \u00b7 ');

    // Distinct from Role · / Name · / Armor · class identity tips.
    expect(brutes).not.toBe(unitRoleLabel('bonker'));
    expect(unitRoleLabel('bonker')).toBe('Role · Combat');
    expect(unitRoleLabel('bonker')).toMatch(/^Role \u00b7 /);
    expect(brutes).not.toBe(unitNameTipLabel('bonker'));
    expect(unitNameTipLabel('bonker')).toBe('Name · Bonker');
    expect(unitNameTipLabel('bonker')).toMatch(/^Name \u00b7 /);
    expect(brutes).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armor \u00b7 /);
    expect(brutes).not.toMatch(/^Role \u00b7 /);
    expect(brutes).not.toMatch(/^Name \u00b7 /);
    expect(brutes).not.toMatch(/^Armor \u00b7 /);
    expect(nobles).not.toMatch(/^Role \u00b7 /);
    expect(weirdos).not.toMatch(/^Name \u00b7 /);

    // Species · variants stay mutually distinct.
    expect(brutes).not.toBe(nobles);
    expect(brutes).not.toBe(weirdos);
    expect(nobles).not.toBe(weirdos);
  });

  it('localizes Species · middot for pt-BR and es; stays distinct from Role · / Name · / Armor ·', () => {
    setLocale('pt-BR');
    const ptBrutes = unitSpeciesTipLabel('brutes');
    expect(ptBrutes).toBe(
      t('sel.speciesTip', { name: speciesName('brutes') }),
    );
    expect(ptBrutes).toBe('Espécie · Os Brutos');
    expect(ptBrutes).toMatch(/^Espécie \u00b7 /);
    expect(ptBrutes).toContain(' \u00b7 ');
    expect(ptBrutes).not.toContain('  ·  ');
    const ptNobles = unitSpeciesTipLabel('nobles');
    expect(ptNobles).toBe('Espécie · Os Nobres');
    expect(ptNobles).toMatch(/^Espécie \u00b7 /);
    const ptWeirdos = unitSpeciesTipLabel('weirdos');
    expect(ptWeirdos).toBe('Espécie · Os Doidos');
    expect(ptWeirdos).toMatch(/^Espécie \u00b7 /);
    expect(ptBrutes).not.toBe(unitRoleLabel('bonker'));
    expect(unitRoleLabel('bonker')).toBe('Papel · Combate');
    expect(unitRoleLabel('bonker')).toMatch(/^Papel \u00b7 /);
    expect(ptBrutes).not.toBe(unitNameTipLabel('bonker'));
    expect(unitNameTipLabel('bonker')).toMatch(/^Nome \u00b7 /);
    expect(ptBrutes).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armadura \u00b7 /);
    expect(ptBrutes).not.toMatch(/^Papel \u00b7 /);
    expect(ptBrutes).not.toMatch(/^Nome \u00b7 /);
    expect(ptBrutes).not.toMatch(/^Armadura \u00b7 /);

    setLocale('es');
    const esBrutes = unitSpeciesTipLabel('brutes');
    expect(esBrutes).toBe(
      t('sel.speciesTip', { name: speciesName('brutes') }),
    );
    expect(esBrutes).toBe('Especie · Los Brutos');
    expect(esBrutes).toMatch(/^Especie \u00b7 /);
    expect(esBrutes).toContain(' \u00b7 ');
    expect(esBrutes).not.toContain('  ·  ');
    const esNobles = unitSpeciesTipLabel('nobles');
    expect(esNobles).toBe('Especie · Los Nobles');
    expect(esNobles).toMatch(/^Especie \u00b7 /);
    const esWeirdos = unitSpeciesTipLabel('weirdos');
    expect(esWeirdos).toBe('Especie · Los Raros');
    expect(esWeirdos).toMatch(/^Especie \u00b7 /);
    expect(esBrutes).not.toBe(unitRoleLabel('bonker'));
    expect(unitRoleLabel('bonker')).toBe('Rol · Combate');
    expect(unitRoleLabel('bonker')).toMatch(/^Rol \u00b7 /);
    expect(esBrutes).not.toBe(unitNameTipLabel('bonker'));
    expect(unitNameTipLabel('bonker')).toMatch(/^Nombre \u00b7 /);
    expect(esBrutes).not.toBe(unitArmorClassTipLabel('bonker'));
    expect(unitArmorClassTipLabel('bonker')).toMatch(/^Armadura \u00b7 /);
    expect(esBrutes).not.toMatch(/^Rol \u00b7 /);
    expect(esBrutes).not.toMatch(/^Nombre \u00b7 /);
    expect(esBrutes).not.toMatch(/^Armadura \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit is the same species', () => {
    expect(sharedUnitSpeciesTipLabel(['weirdos', 'weirdos'])).toBe(
      t('sel.speciesTip', { name: speciesName('weirdos') }),
    );
    expect(sharedUnitSpeciesTipLabel(['brutes', 'nobles'])).toBeNull();
    expect(sharedUnitSpeciesTipLabel([])).toBeNull();
  });
});
