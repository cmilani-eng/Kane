import { describe, expect, it } from 'vitest';
import { speciesName, t } from '../../i18n';
import {
  sharedUnitSpeciesTipLabel,
  unitSpeciesTipLabel,
} from './unitSpeciesTip';

describe('unitSpeciesTip', () => {
  it('labels the species name for a unit selection', () => {
    expect(unitSpeciesTipLabel('brutes')).toBe(
      t('sel.speciesTip', { name: speciesName('brutes') }),
    );
    expect(unitSpeciesTipLabel('nobles')).toContain(speciesName('nobles'));
  });

  it('shares a tip only when every selected unit is the same species', () => {
    expect(sharedUnitSpeciesTipLabel(['weirdos', 'weirdos'])).toBe(
      t('sel.speciesTip', { name: speciesName('weirdos') }),
    );
    expect(sharedUnitSpeciesTipLabel(['brutes', 'nobles'])).toBeNull();
    expect(sharedUnitSpeciesTipLabel([])).toBeNull();
  });
});
