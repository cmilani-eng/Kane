import { describe, expect, it } from 'vitest';
import { speciesCopy, t } from '../../i18n';
import { pauseSpeciesMottoTipLine } from './pauseSpeciesMottoTip';

describe('pauseSpeciesMottoTipLine', () => {
  it('pairs species name with motto for the pause tip', () => {
    const s = speciesCopy('brutes');
    expect(pauseSpeciesMottoTipLine('brutes')).toBe(
      t('pause.speciesMotto', { name: s.name, motto: s.motto }),
    );
    expect(pauseSpeciesMottoTipLine('brutes')).toContain(s.motto);
  });
});
