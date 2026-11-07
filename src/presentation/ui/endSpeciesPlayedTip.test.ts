import { describe, expect, it } from 'vitest';
import { speciesName, t } from '../../i18n';
import { endSpeciesPlayedTipLine } from './endSpeciesPlayedTip';

describe('endSpeciesPlayedTipLine', () => {
  it('labels the species played for the end screen tip', () => {
    const name = speciesName('brutes');
    expect(endSpeciesPlayedTipLine('brutes')).toBe(
      t('end.speciesTip', { name }),
    );
    expect(endSpeciesPlayedTipLine('brutes')).toContain(name);
  });
});
